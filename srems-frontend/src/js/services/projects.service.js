/**
 * projects.service.js
 * Project CRUD operations and business logic
 * Like backend's projects service
 */

import apiClient from './api.js';
import { API_CONFIG } from '../utils/constants.js';

class ProjectsService {
  /**
   * Create a new project
   */
  async createProject(projectData) {
    const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.PROJECTS}/create`, projectData);
    
    // Check if response was successful
    if (!response.success) {
      throw new Error(response.message || 'Failed to create project');
    }
    
    // Return the project object from nested data structure
    // Backend response: { success, message, data: { project: {...} } }
    return response.data?.data?.project || {};
  }

  /**
   * Get all projects (with pagination)
   */
  async getProjects(page = 1, pageSize = 10) {
    const role = localStorage.getItem('user_role');
    const clientRoles = ['sponsor', 'partner', 'vendor', 'end_user', 'other'];
    const isClient = clientRoles.includes(role);
    const endpoint = isClient ? '/clients/list-projects' : `${API_CONFIG.ENDPOINTS.PROJECTS}/list`;
    
    const response = await apiClient.get(
      `${endpoint}?page=${page}&pageSize=${pageSize}`
    );
    
    // Check if response was successful
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch projects');
    }
    
    // Return the projects array from nested data structure
    // Backend response: { success, message, data: { projects: [...], pagination: {...} } }
    return response.data?.data?.projects || [];
  }

  /**
   * Get single project by ID
   */
  async getProjectById(projectId) {
    const role = localStorage.getItem('user_role');
    const clientRoles = ['sponsor', 'partner', 'vendor', 'end_user', 'other'];
    const isClient = clientRoles.includes(role);
    const endpoint = isClient ? `/clients/view-project/${projectId}` : `${API_CONFIG.ENDPOINTS.PROJECTS}/get/${projectId}`;
    
    const response = await apiClient.get(endpoint);
    
    // Check if response was successful
    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch project');
    }
    
    // Return the project object from nested data structure
    return response.data?.data?.project || {};
  }

  /**
   * Update project
   */
  async updateProject(projectId, updateData) {
    const response = await apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/update/${projectId}`,
      updateData
    );
    
    // Check if response was successful
    if (!response.success) {
      throw new Error(response.message || 'Failed to update project');
    }
    
    // Return the project object from nested data structure
    return response.data?.data?.project || {};
  }

  /**
   * Delete project
   */
  async deleteProject(projectId, deletionReason = 'other', description = '') {
    const deleteData = {
      deletionReasonType: deletionReason,
    };
    
    if (description) {
      deleteData.deletionReasonDescription = description;
    }
    
    console.log('[DELETE] Sending data:', deleteData);
    
    const response = await apiClient.delete(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/delete/${projectId}`, 
      deleteData
    );
    
    console.log('[DELETE] Response:', response);
    
    // Check if response was successful
    if (!response.success) {
      // Log full error details for debugging
      console.error('[DELETE ERROR] Full response:', response);
      throw new Error(response.message || 'Failed to delete project');
    }
    
    return response.data || {};
  }

  /**
   * Put project on hold
   */
  async putProjectOnHold(projectId, reasonType, reasonDescription = '') {
    const data = { onHoldReasonType: reasonType };
    if (reasonDescription) {
      data.onHoldReasonDescription = reasonDescription;
    }
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/on-hold/${projectId}`,
      data
    );
  }

  /**
   * Abort project
   */
  async abortProject(projectId, reasonType, reasonDescription = '') {
    const data = { abortReasonType: reasonType };
    if (reasonDescription) {
      data.abortReasonDescription = reasonDescription;
    }
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/abort/${projectId}`,
      data
    );
  }

  /**
   * Complete project
   */
  async completeProject(projectId) {
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/complete/${projectId}`,
      {}
    );
  }

  /**
   * Resume project from hold or abort
   */
  async resumeProject(projectId, reasonType, reasonDescription = '') {
    const data = { resumeReasonType: reasonType };
    if (reasonDescription) {
      data.resumeReasonDescription = reasonDescription;
    }
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/resume/${projectId}`,
      data
    );
  }

  /**
   * Activate project
   */
  async activateProject(projectId, reasonType, reasonDescription = '') {
    const data = { activationReasonType: reasonType };
    if (reasonDescription) {
      data.activationReasonDescription = reasonDescription;
    }
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/activate/${projectId}`,
      data
    );
  }

  /**
   * Archive project
   */
  async archiveProject(projectId) {
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/archive/${projectId}`,
      {}
    );
  }

  /**
   * Change project owner
   */
  async changeProjectOwner(projectId, userId, reasonType, reasonDescription = '', prevOwnerRole = null) {
    const changeData = {
      userId,
      changeOwnerReasonType: reasonType
    };
    
    if (reasonDescription) {
      changeData.ownerChangeReasonDescription = reasonDescription;
    }
    
    if (prevOwnerRole) {
      changeData.prevOwnerRole = prevOwnerRole;
    }
    
    return apiClient.patch(
      `${API_CONFIG.ENDPOINTS.PROJECTS}/change-owner/${projectId}`,
      changeData
    );
  }
}

export const projectsService = new ProjectsService();
export default projectsService;
