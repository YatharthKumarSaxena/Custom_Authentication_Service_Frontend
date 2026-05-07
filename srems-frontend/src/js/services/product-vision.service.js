/**
 * product-vision.service.js
 * Product vision management operations
 */

import apiClient from './api.js';
import { API_CONFIG } from '../utils/constants.js';

class ProductVisionService {
  /**
   * Create product vision
   * Backend: POST /product-vision/create/:projectId
   */
  async createProductVision(visionData) {
    const { projectId, ...data } = visionData;
    return apiClient.post(
      `${API_CONFIG.ENDPOINTS.PRODUCT_VISION}/create/${projectId}`,
      data
    );
  }

  /**
   * Get product vision for a project
   * Backend: /product-vision/get/:projectId
   */
  async getProductVisions(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required to fetch product visions');
      }
      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.PRODUCT_VISION}/get/${projectId}`
      );
      
      if (!response.success) {
        return [];
      }
      
      // Backend returns single object or array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return response.data ? [response.data] : [];
    } catch (error) {
      console.error('Failed to fetch product visions:', error);
      return [];
    }
  }

  /**
   * Get product vision by ID
   * Backend: GET /product-vision/get/:projectId
   */
  async getProductVisionById(projectId) {
    return apiClient.get(
      `${API_CONFIG.ENDPOINTS.PRODUCT_VISION}/get/${projectId}`
    );
  }

  /**
   * Update product vision
   * Backend: PATCH /product-vision/update/:projectId
   */
  async updateProductVision(projectId, updateData) {
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PRODUCT_VISION}/update/${projectId}`,
      updateData
    );
  }

  /**
   * Delete product vision
   * Backend: DELETE /product-vision/delete/:projectId
   */
  async deleteProductVision(projectId, deleteData = {}) {
    return apiClient.delete(
      `${API_CONFIG.ENDPOINTS.PRODUCT_VISION}/delete/${projectId}`,
      deleteData
    );
  }

  /**
   * Get product visions by product (deprecated - use getProductVisions instead)
   */
  async getProductVisionsByProduct(productId) {
    return apiClient.get(
      `${API_CONFIG.ENDPOINTS.PRODUCT_VISION}/product/${productId}`
    );
  }

  /**
   * Get product visions by status (deprecated)
   * Get product visions by status
   */
  async getProductVisionsByStatus(status) {
    return apiClient.get(
      `${API_CONFIG.ENDPOINTS.PRODUCT_VISION}/status/${status}`
    );
  }
}

export const productVisionService = new ProductVisionService();
export default productVisionService;
