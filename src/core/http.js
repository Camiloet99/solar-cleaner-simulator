const axios = require('axios');
const { backendBase, apiKey } = require('../config');

const api = axios.create({
  baseURL: backendBase,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(cfg => {
  if (apiKey) cfg.headers['X-Api-Key'] = apiKey;
  return cfg;
});

module.exports = { api };
