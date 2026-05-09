/**
 * validation.service.js
 * Validation management operations
 * 
 * Backend Endpoints:
 * POST   /projects/:projectId/validations
 * GET    /projects/:projectId/validations
 * GET    /projects/:projectId/validations/latest
 * GET    /projects/:projectId/validations/:validationId
 * PATCH  /projects/:projectId/validations/:validationId
 * PATCH  /projects/:projectId/validations/:validationId/complete
 * DELETE /projects/:projectId/validations/:validationId
 */

import apiClient from './api.js';
import { API_CONFIG } from '../utils/constants.js';

class ValidationService {
  /**
   * Create new validation
   * Backend: POST /projects/:projectId/validations
   * REQUIRED FIELDS: title
   * OPTIONAL FIELDS: description, validationType, expectedDuration
   */
  async createValidation(projectId, validationData) {
    try {
      const response = await apiClient.post(
        `/projects/${projectId}/validations`,
        validationData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create validation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to create validation:', error);
      throw error;
    }
  }

  /**
   * Get all validations for a project
   * Backend: GET /projects/:projectId/validations
   */
  async getValidations(projectId, page = 1, pageSize = 10) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required to fetch validations');
      }

      const response = await apiClient.get(
        `/projects/${projectId}/validations?page=${page}&pageSize=${pageSize}`
      );
      
      if (!response.success) {
        return [];
      }
      
      return Array.isArray(response.data?.data?.validations) ? response.data.data.validations :
             Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch validations:', error);
      return [];
    }
  }

  /**
   * Get latest (active) validation for a project
   * Backend: GET /projects/:projectId/validations/latest
   */
  async getLatestValidation(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await apiClient.get(
        `/projects/${projectId}/validations/latest`
      );
      
      if (!response.success) {
        return null;
      }
      
      return response.data || null;
    } catch (error) {
      console.error('Failed to fetch latest validation:', error);
      return null;
    }
  }

  /**
   * Get single validation by ID
   * Backend: GET /projects/:projectId/validations/:validationId
   */
  async getValidation(projectId, validationId) {
    try {
      if (!projectId || !validationId) {
        throw new Error('Project ID and Validation ID are required');
      }

      const response = await apiClient.get(
        `/projects/${projectId}/validations/${validationId}`
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch validation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch validation:', error);
      throw error;
    }
  }

  /**
   * Update validation
   * Backend: PATCH /projects/:projectId/validations/:validationId
   * OPTIONAL FIELDS: title, description, validationType, expectedDuration
   */
  async updateValidation(projectId, validationId, validationData) {
    try {
      const response = await apiClient.patch(
        `/projects/${projectId}/validations/${validationId}`,
        validationData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update validation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to update validation:', error);
      throw error;
    }
  }

  /**
   * Complete validation (mark as done and lock)
   * Backend: PATCH /projects/:projectId/validations/:validationId/complete
   * OPTIONAL FIELDS: completeReason, completeDescription, validationResult
   */
  async completeValidation(projectId, validationId, completeData = {}) {
    try {
      const response = await apiClient.patch(
        `/projects/${projectId}/validations/${validationId}/complete`,
        completeData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to complete validation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to complete validation:', error);
      throw error;
    }
  }

  /**
   * Delete validation (soft delete)
   * Backend: DELETE /projects/:projectId/validations/:validationId
   * OPTIONAL FIELDS: deletionReasonType, deletionReasonDescription
   */
  async deleteValidation(projectId, validationId, deleteData = {}) {
    try {
      const response = await apiClient.delete(
        `/projects/${projectId}/validations/${validationId}`,
        deleteData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete validation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to delete validation:', error);
      throw error;
    }
  }
}

export const validationService = new ValidationService();
export default validationService;
