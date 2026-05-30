const successResponse = (res, data, message = 'Success', statusCode = 200, meta = null) => {
  const response: any = {
    success: true,
    message,
    data,
  };
  
  if (meta && Object.keys(meta).length > 0) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
};

const errorResponse = (res, message = 'Error', errors = null, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export { successResponse, errorResponse };
