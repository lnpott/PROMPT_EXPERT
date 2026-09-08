import { deleteCredential, putCredential } from '../credential-service.js';

export default function handler(request, response) {
  return request.method === 'DELETE'
    ? deleteCredential(request, response)
    : putCredential(request, response);
}
