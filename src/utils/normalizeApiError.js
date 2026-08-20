export default function normalizeApiError(error) {
  const requestId = error.response?.headers?.['x-request-id'] || error.response?.data?.request_id || 'sys';

  // If it's a direct JS/Supabase error
  if (!error.response) {
    return {
      type: 'error',
      message: error?.message || 'An unexpected error occurred.',
      fieldErrors: {},
      status: 0,
      code: error?.code || 'ERROR',
      requestId,
    };
  }

  const { status, data } = error.response;
  const message = data?.message || 'An unexpected error occurred.';
  const code = data?.code || null;
  const fieldErrors = data?.errors || {};

  let type = 'server';
  if (status === 422 || status === 400) type = 'validation';
  else if (status === 401) type = 'authentication';
  else if (status === 403) type = 'authorization';
  else if (status === 404) type = 'not_found';
  else if (status === 409) type = 'conflict';

  return { type, message, fieldErrors, status, code, requestId };
}
