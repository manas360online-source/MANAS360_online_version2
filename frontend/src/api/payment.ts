import { http } from '../lib/http';

export const initiateUniversalPayment = async (payload: any) => {
  const response = await http.post('/v1/payments/universal/initiate', payload);
  return response.data.data;
};

export const verifyUniversalPayment = async (transactionId: string) => {
  const response = await http.get('/v1/payments/universal/verify', {
    params: { transactionId },
  });
  return response.data.data;
};