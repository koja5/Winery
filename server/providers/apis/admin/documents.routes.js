const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { randomUUID } = require('crypto');
const router = express.Router();
const pool = require('../../config/sql-database').connect();
const logger = require('../../config/logger');

fs.mkdirSync(process.env.FILE_STORAGE, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, process.env.FILE_STORAGE),
  filename: (_, file, cb) => {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png'
];

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Nedozvoljen tip fajla.'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

function parseIdList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[')) {
      try {
        const arr = JSON.parse(trimmed);
        return Array.isArray(arr) ? arr.filter(Boolean) : [];
      } catch {
        return [];
      }
    }
    return trimmed ? [trimmed] : [];
  }
  return [];
}

// ---------------------------------------------------------------------------
// POST /documents/upload -> new files (multipart "files") and/or existing
// library files (link_ids) attached to one entity in a single call.
// body: entity_type, entity_id, link_ids
// ---------------------------------------------------------------------------
router.post('/documents/upload', upload.array('files'), async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.body;
    const linkIds = parseIdList(req.body.link_ids);
    const files = req.files || [];

    if (files.length === 0 && linkIds.length === 0) {
      return res.status(400).json({ message: 'Nema fajlova.' });
    }
    if (!entity_type || !entity_id) {
      return res.status(400).json({ message: 'entity_type i entity_id su obavezni.' });
    }

    const tenantId = req.user.tenant_id;
    const created = [];

    for (const file of files) {
      const documentId = randomUUID();
      await pool.query(
        'INSERT INTO documents (id, tenant_id, uploaded_by, name, path, mime_type, size_bytes) VALUES (?,?,?,?,?,?,?)',
        [documentId, tenantId, req.user.sub || null, file.originalname, file.filename, file.mimetype, file.size]
      );
      await pool.query(
        'INSERT INTO document_links (id, document_id, entity_type, entity_id) VALUES (?,?,?,?)',
        [randomUUID(), documentId, entity_type, entity_id]
      );
      created.push({ id: documentId, name: file.originalname, path: file.filename });
    }

    for (const documentId of linkIds) {
      await pool.query(
        `INSERT INTO document_links (id, document_id, entity_type, entity_id)
         SELECT ?, id, ?, ? FROM documents WHERE id = ? AND tenant_id = ?
         ON DUPLICATE KEY UPDATE document_links.id = document_links.id`,
        [randomUUID(), entity_type, entity_id, documentId, tenantId]
      );
    }

    res.json(created);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /documents/upload-library -> add file(s) to the library only.
// ---------------------------------------------------------------------------
router.post('/documents/upload-library', upload.array('files'), async (req, res, next) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'Nema fajlova.' });
    }
    const tenantId = req.user.tenant_id;
    const created = [];

    for (const file of files) {
      const documentId = randomUUID();
      await pool.query(
        'INSERT INTO documents (id, tenant_id, uploaded_by, name, path, mime_type, size_bytes) VALUES (?,?,?,?,?,?,?)',
        [documentId, tenantId, req.user.sub || null, file.originalname, file.filename, file.mimetype, file.size]
      );
      created.push({ id: documentId, name: file.originalname, path: file.filename });
    }

    res.json(created);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /documents/link -> attach already-uploaded file(s) to a record.
// body: entity_type, entity_id, document_id (string | string[])
// ---------------------------------------------------------------------------
router.post('/documents/link', async (req, res, next) => {
  try {
    const { entity_type, entity_id } = req.body;
    const ids = parseIdList(req.body.document_id);

    if (!entity_type || !entity_id || ids.length === 0) {
      return res.status(400).json({ message: 'entity_type, entity_id i document_id su obavezni.' });
    }

    const tenantId = req.user.tenant_id;
    for (const documentId of ids) {
      await pool.query(
        `INSERT INTO document_links (id, document_id, entity_type, entity_id)
         SELECT ?, id, ?, ? FROM documents WHERE id = ? AND tenant_id = ?
         ON DUPLICATE KEY UPDATE document_links.id = document_links.id`,
        [randomUUID(), entity_type, entity_id, documentId, tenantId]
      );
    }
    res.json({ linked: ids.length });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /documents/list/:entityType/:entityId -> files attached to one record
// ---------------------------------------------------------------------------
router.get('/documents/list/:entityType/:entityId', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id as link_id, d.id, d.name, d.path, d.mime_type, d.size_bytes, l.created_at
       FROM document_links l JOIN documents d ON d.id = l.document_id
       WHERE l.entity_type = ? AND l.entity_id = ? AND d.tenant_id = ?
       ORDER BY l.created_at DESC`,
      [req.params.entityType, req.params.entityId, req.user.tenant_id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /documents/library -> all files of this tenant (picker + browse), ?search=
// ---------------------------------------------------------------------------
router.get('/documents/library', async (req, res, next) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : null;
    const params = [req.user.tenant_id];
    let where = 'WHERE d.tenant_id = ?';
    if (search) {
      where += ' AND d.name LIKE ?';
      params.push(search);
    }
    const [rows] = await pool.query(
      `SELECT d.id, d.name, d.path, d.mime_type, d.size_bytes, d.created_at,
              GROUP_CONCAT(DISTINCT l.entity_type) as entity_types, COUNT(l.id) as links_count
       FROM documents d LEFT JOIN document_links l ON l.document_id = d.id
       ${where}
       GROUP BY d.id ORDER BY d.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /documents/unlink -> detach a file from a record; deletes the
// physical file only once no links remain.
// body: link_id
// ---------------------------------------------------------------------------
router.post('/documents/unlink', async (req, res, next) => {
  try {
    const { link_id } = req.body;
    if (!link_id) {
      return res.status(400).json({ message: 'link_id je obavezan.' });
    }

    const [links] = await pool.query(
      `SELECT l.id, l.document_id FROM document_links l
       JOIN documents d ON d.id = l.document_id
       WHERE l.id = ? AND d.tenant_id = ?`,
      [link_id, req.user.tenant_id]
    );
    if (!links.length) {
      return res.status(404).json({ message: 'Veza nije pronađena.' });
    }
    const documentId = links[0].document_id;

    await pool.query('DELETE FROM document_links WHERE id = ?', [link_id]);

    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM document_links WHERE document_id = ?', [
      documentId
    ]);
    if (count === 0) {
      await removeDocument(documentId, req.user.tenant_id);
    }

    res.json({ unlinked: true });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /documents/:id/download -> streams the file (tenant-scoped)
// ---------------------------------------------------------------------------
router.get('/documents/:id/download', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT name, path, mime_type FROM documents WHERE id = ? AND tenant_id = ?', [
      req.params.id,
      req.user.tenant_id
    ]);
    if (!rows.length) {
      return res.status(404).json({ message: 'Fajl nije pronađen.' });
    }
    const doc = rows[0];
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.name)}"`);
    if (doc.mime_type) res.setHeader('Content-Type', doc.mime_type);
    res.sendFile(doc.path, { root: process.env.FILE_STORAGE });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /documents/:id -> hard-delete a file from the library (links cascade)
// ---------------------------------------------------------------------------
router.delete('/documents/:id', async (req, res, next) => {
  try {
    const removed = await removeDocument(req.params.id, req.user.tenant_id);
    if (!removed) {
      return res.status(404).json({ message: 'Fajl nije pronađen.' });
    }
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

async function removeDocument(documentId, tenantId) {
  const [rows] = await pool.query('SELECT path FROM documents WHERE id = ? AND tenant_id = ?', [
    documentId,
    tenantId
  ]);
  if (!rows.length) return false;

  await pool.query('DELETE FROM documents WHERE id = ? AND tenant_id = ?', [documentId, tenantId]);

  try {
    fs.unlinkSync(process.env.FILE_STORAGE + rows[0].path);
  } catch (err) {
    logger.warn(`Document file unlink failed: ${err.message}`);
  }
  return true;
}

module.exports = router;
