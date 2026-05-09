/**
 * negotiation.service.js
 * Negotiation management operations
 * 
 * Backend Endpoints:
 * POST   /projects/:projectId/negotiations
 * GET    /projects/:projectId/negotiations
 * GET    /projects/:projectId/negotiations/latest
 * GET    /projects/:projectId/negotiations/:negotiationId
 * PATCH  /projects/:projectId/negotiations/:negotiationId
 * PATCH  /projects/:projectId/negotiations/:negotiationId/freeze
 * DELETE /projects/:projectId/negotiations/:negotiationId
 */

import apiClient from './api.js';
import { API_CONFIG } from '../utils/constants.js';

class NegotiationService {
  /**
   * Create new negotiation
   * Backend: POST /projects/:projectId/negotiations
   * REQUIRED FIELDS: title, mode (COLLABORATIVE/COMPETITIVE)
   * OPTIONAL FIELDS: description, expectedDuration
   */
  async createNegotiation(projectId, negotiationData) {
    try {
      const response = await apiClient.post(
        `/projects/${projectId}/negotiations`,
        negotiationData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to create negotiation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to create negotiation:', error);
      throw error;
    }
  }

  /**
   * Get all negotiations for a project
   * Backend: GET /projects/:projectId/negotiations
   */
  async getNegotiations(projectId, page = 1, pageSize = 10) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required to fetch negotiations');
      }

      const response = await apiClient.get(
        `/projects/${projectId}/negotiations?page=${page}&pageSize=${pageSize}`
      );
      
      if (!response.success) {
        return [];
      }
      
      return Array.isArray(response.data?.data?.negotiations) ? response.data.data.negotiations :
             Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Failed to fetch negotiations:', error);
      return [];
    }
  }

  /**
   * Get latest (active) negotiation for a project
   * Backend: GET /projects/:projectId/negotiations/latest
   */
  async getLatestNegotiation(projectId) {
    try {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const response = await apiClient.get(
        `/projects/${projectId}/negotiations/latest`
      );
      
      if (!response.success) {
        return null;
      }
      
      return response.data || null;
    } catch (error) {
      console.error('Failed to fetch latest negotiation:', error);
      return null;
    }
  }

  /**
   * Get single negotiation by ID
   * Backend: GET /projects/:projectId/negotiations/:negotiationId
   */
  async getNegotiation(projectId, negotiationId) {
    try {
      if (!projectId || !negotiationId) {
        throw new Error('Project ID and Negotiation ID are required');
      }

      const response = await apiClient.get(
        `/projects/${projectId}/negotiations/${negotiationId}`
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch negotiation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to fetch negotiation:', error);
      throw error;
    }
  }

  /**
   * Update negotiation
   * Backend: PATCH /projects/:projectId/negotiations/:negotiationId
   * OPTIONAL FIELDS: mode, title, description, expectedDuration
   */
  async updateNegotiation(projectId, negotiationId, negotiationData) {
    try {
      const response = await apiClient.patch(
        `/projects/${projectId}/negotiations/${negotiationId}`,
        negotiationData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update negotiation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to update negotiation:', error);
      throw error;
    }
  }

  /**
   * Freeze negotiation (finalize and lock)
   * Backend: PATCH /projects/:projectId/negotiations/:negotiationId/freeze
   * OPTIONAL FIELDS: freezeReason, freezeDescription
   */
  async freezeNegotiation(projectId, negotiationId, freezeData = {}) {
    try {
      const response = await apiClient.patch(
        `/projects/${projectId}/negotiations/${negotiationId}/freeze`,
        freezeData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to freeze negotiation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to freeze negotiation:', error);
      throw error;
    }
  }

  /**
   * Delete negotiation (soft delete)
   * Backend: DELETE /projects/:projectId/negotiations/:negotiationId
   * OPTIONAL FIELDS: deletionReasonType, deletionReasonDescription
   */
  async deleteNegotiation(projectId, negotiationId, deleteData = {}) {
    try {
      const response = await apiClient.delete(
        `/projects/${projectId}/negotiations/${negotiationId}`,
        deleteData
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete negotiation');
      }
      
      return response;
    } catch (error) {
      console.error('Failed to delete negotiation:', error);
      throw error;
    }
  }
}

export const negotiationService = new NegotiationService();
export default negotiationService;
