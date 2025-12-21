const path = require('path');
const multer = require('multer');
const { v4: uuid } = require('uuid');

const makeStorage = (directory) => multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, `../../uploads/${directory}`));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${directory}-${uuid()}${ext}`);
  }
});

const createUploader = (folder, limits = { fileSize: 10 * 1024 * 1024 }) => multer({
  storage: makeStorage(folder),
  limits,
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'video/mp4', 'video/mpeg', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format'));
    }
  }
});

const uploadProfile = createUploader('profiles');
const uploadCompetition = createUploader('competitions');
const uploadWinner = createUploader('winners');
const uploadLogo = createUploader('logos');
const uploadSubmission = createUploader('submissions', { fileSize: 200 * 1024 * 1024 });

module.exports = {
  uploadProfile,
  uploadCompetition,
  uploadWinner,
  uploadLogo,
  uploadSubmission
};
