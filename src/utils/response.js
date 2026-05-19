const successResponse = (res, data, message = 'Success', meta = {}) => {
  return res.json({
    success: true,
    message,
    data,
    meta,
  });
};

const errorResponse = (res, message = 'Error', errors = null, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = { successResponse, errorResponse };
