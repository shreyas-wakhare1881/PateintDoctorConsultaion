import axios from 'axios';
import { API_CONFIG } from '@/config/api.config';

const apiClient = axios.create(API_CONFIG);

export default apiClient;
