import { projectsService } from '../js/services/projects.service.js';
import { store } from '../js/store/store.js';
import { showToast, showConfirmDialog, showModal, hideModal, debounce, formatDate } from '../js/utils/helpers.js';
import { validateFormData, FORM_FIELDS } from '../js/utils/config.js';
import { PHASES, PROJECT_STATUS, STATUS_COLORS as COLORS } from '../js/utils/constants.js';

// Dev: page load info
try { console.info('[Page] ProjectsPage loaded — app version', window?.SREMS_APP_VERSION || 'unknown'); } catch (e) {}

export class ProjectsPage {
  constructor() {
    this.projects = [];
    this.filteredProjects = [];
    this.editingProjectId = null;
    this.isSubmitting = false; // Prevent double form submission
    this.lastSubmitTime = 0; // Track last submission time
    this.submissionCount = 0; // Track total submissions for debugging
    this.currentSubmissionId = null; // Track current submission
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadProjects();
  }

  attachEventListeners() {
    // Create project buttons
    const btnCreateProject = document.getElementById('btnCreateProject');
    if (btnCreateProject) {
      btnCreateProject.removeEventListener('click', this.createClickHandler);
      this.createClickHandler = () => this.openCreateModal();
      btnCreateProject.addEventListener('click', this.createClickHandler);
    }

    const btnCreateProjectEmpty = document.getElementById('btnCreateProjectEmpty');
    if (btnCreateProjectEmpty) {
      btnCreateProjectEmpty.removeEventListener('click', this.createClickHandler);
      btnCreateProjectEmpty.addEventListener('click', this.createClickHandler);
    }

    // Form submission - Remove old listener and add new one
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
      if (this.formSubmitHandler) {
        projectForm.removeEventListener('submit', this.formSubmitHandler);
      }
      this.formSubmitHandler = (e) => this.handleFormSubmit(e);
      projectForm.addEventListener('submit', this.formSubmitHandler);
    }

    // Filters
    const filterStatus = document.getElementById('filterStatus');
    if (filterStatus) {
      filterStatus.removeEventListener('change', this.filterChangeHandler);
      this.filterChangeHandler = () => this.applyFilters();
      filterStatus.addEventListener('change', this.filterChangeHandler);
    }

    const searchProjects = document.getElementById('searchProjects');
    if (searchProjects) {
      searchProjects.removeEventListener('input', this.searchInputHandler);
      this.searchInputHandler = debounce(() => this.applyFilters(), 300);
      searchProjects.addEventListener('input', this.searchInputHandler);
    }

    // Modal close button
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.removeEventListener('click', this.modalCloseHandler);
      this.modalCloseHandler = (e) => {
        const modalId = e.currentTarget.getAttribute('data-close-modal');
        hideModal(modalId);
      };
      btn.addEventListener('click', this.modalCloseHandler);
    });
  }

  async loadProjects() {
    try {
      const container = document.getElementById('projectsContainer');
      container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading projects...</p></div>';

      const data = await projectsService.getProjects();
      this.projects = Array.isArray(data) ? data : [];
      this.filteredProjects = this.projects;
      this.renderProjects();
    } catch (error) {
      showToast(error.message || 'Failed to load projects', 'error');
      // Initialize with empty arrays to prevent .filter() errors
      this.projects = [];
      this.filteredProjects = [];
      document.getElementById('projectsContainer').innerHTML = `<div class="error-message">${error.message || 'Failed to load projects'}</div>`;
    }
  }

  applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const search = document.getElementById('searchProjects').value.toLowerCase();
    // Ensure projects is always an array
    if (!Array.isArray(this.projects)) {
      this.projects = [];
    }
    this.filteredProjects = this.projects.filter(p => {
      const statusMatch = !status || p.currentPhase === status;
      const searchMatch = p.name.toLowerCase().includes(search) || p.description?.toLowerCase().includes(search);
      return statusMatch && searchMatch;
    });

    this.renderProjects();
  }

  renderProjects() {
    const container = document.getElementById('projectsContainer');
    const empty = document.getElementById('emptyProjects');

    if (this.filteredProjects.length === 0) {
      container.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }

    container.classList.remove('hidden');
    empty.classList.add('hidden');
    container.innerHTML = this.filteredProjects.map(project => this.createProjectCard(project)).join('');

    // Attach card event listeners
    container.querySelectorAll('.project-card').forEach(card => {
      this.attachCardListeners(card);
    });

    // Dev: log how many projects were rendered
    try { console.debug(`[Projects] Rendered ${this.filteredProjects.length} project(s)`); } catch (e) {}
  }

  createProjectCard(project) {
    const statusBadge = PHASES[project.currentPhase] || project.currentPhase || 'inception';
    const statusColor = COLORS.phases?.[project.currentPhase] || '#6c757d';
    const createdDate = formatDate(project.createdAt) || 'N/A';
    
    return `
      <div class="project-card" data-project-id="${project._id}">
        <div class="card-header-enhanced">
          <div class="card-title-section">
            <h3 class="card-title">${project.name}</h3>
          </div>
          <span class="phase-badge" style="background-color: ${statusColor}; color: white;">${statusBadge}</span>
        </div>
        
        <p class="card-description">${project.description || 'No description'}</p>
        
        <div class="card-details-grid">
          <div class="detail-item">
            <span class="detail-label">Type</span>
            <span class="detail-value">${project.projectType ? project.projectType.charAt(0).toUpperCase() + project.projectType.slice(1) : '—'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Category</span>
            <span class="detail-value">${project.projectCategory ? project.projectCategory.replace('_', ' ').charAt(0).toUpperCase() + project.projectCategory.slice(1) : '—'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Complexity</span>
            <span class="detail-value">${project.projectComplexity || '—'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Status</span>
            <span class="detail-value"><span class="card-status-tag ${project.projectStatus?.toLowerCase()}">${project.projectStatus || 'Active'}</span></span>
          </div>
        </div>
        
        <div class="card-meta-row">
          <div class="meta-item">
            <span class="meta-icon">💵</span>
            <span class="meta-text"><strong>Budget:</strong> $${project.expectedBudget?.toLocaleString() || '0'}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">⏱️</span>
            <span class="meta-text"><strong>Timeline:</strong> ${project.expectedTimelineInDays || '—'} days</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">📆</span>
            <span class="meta-text"><strong>Created:</strong> ${createdDate}</span>
          </div>
        </div>
        
        <div class="card-actions-group">
          <button class="btn-action view-project" title="View project details">
            <span class="btn-icon">👁️</span>
            <span>View</span>
          </button>
          <button class="btn-action edit-project" title="Edit project">
            <span class="btn-icon">✎</span>
            <span>Edit</span>
          </button>
          <button class="btn-action delete-project btn-danger" title="Delete project">
            <span class="btn-icon">🗑️</span>
            <span>Delete</span>
          </button>
        </div>
      </div>
    `;
  }

  attachCardListeners(card) {
    const projectId = card.dataset.projectId;

    card.querySelector('.view-project')?.addEventListener('click', () => {
      store.setCurrentProject(projectId);
      window.location.hash = `#/project-detail?project=${projectId}`;
    });

    card.querySelector('.edit-project')?.addEventListener('click', () => this.openEditModal(projectId));

    card.querySelector('.delete-project')?.addEventListener('click', () => this.deleteProject(projectId));
  }

  openCreateModal() {
    this.editingProjectId = null;
    
    // Clear form
    document.getElementById('projectForm').reset();
    
    // Clear all error messages
    document.querySelectorAll('.form-error').forEach(error => {
      error.textContent = '';
    });
    
    // Update title
    document.getElementById('projectModalTitle').textContent = 'Create New Project';
    
    // Show modal
    showModal('projectModal');
  }

  openEditModal(projectId) {
    const project = this.projects.find(p => p._id === projectId);
    if (!project) return;

    this.editingProjectId = projectId;
    
    // Clear all error messages
    document.querySelectorAll('.form-error').forEach(error => {
      error.textContent = '';
    });
    
    // Update title
    document.getElementById('projectModalTitle').textContent = 'Edit Project';
    
    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('problemStatement').value = project.problemStatement || '';
    document.getElementById('goal').value = project.goal || '';
    document.getElementById('projectCreationReasonType').value = project.projectCreationReasonType || '';
    document.getElementById('projectCategory').value = project.projectCategory || '';
    document.getElementById('projectType').value = project.projectType || '';
    document.getElementById('expectedBudget').value = project.expectedBudget || '';
    document.getElementById('expectedTimelineInDays').value = project.expectedTimelineInDays || '';
    document.getElementById('projectComplexity').value = project.projectComplexity || '';
    document.getElementById('projectCriticality').value = project.projectCriticality || '';
    document.getElementById('projectPriority').value = project.projectPriority || '';
    
    showModal('projectModal');
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation(); // CRITICAL: Stop event bubbling to prevent duplicate submissions

    // Generate unique submission ID
    const submissionId = ++this.submissionCount;
    console.log(`🆔 [SUBMISSION #${submissionId}] Starting...`);

    // Prevent double submission - both flag and time-based check
    const now = Date.now();
    if (this.isSubmitting === true) {
      console.warn(`🚫 [SUBMISSION #${submissionId}] BLOCKED - Already processing submission #${this.currentSubmissionId}!`);
      return;
    }
    
    if (now - this.lastSubmitTime < 2000) {
      console.warn(`⚠️ [SUBMISSION #${submissionId}] BLOCKED - Too soon after last submission (${now - this.lastSubmitTime}ms ago)`);
      return;
    }
    
    // Lock the form immediately
    this.isSubmitting = true;
    this.currentSubmissionId = submissionId;
    this.lastSubmitTime = now;
    console.log(`🔒 [SUBMISSION #${submissionId}] Locked - isSubmitting = true`);

    // Disable submit button during submission
    const submitBtn = document.querySelector('#projectForm button[type="submit"]');
    const originalBtnText = submitBtn?.textContent || 'Save Project';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    const formData = {};

    // Always collect core fields
    const name = document.getElementById('projectName').value.trim();
    const description = document.getElementById('projectDescription').value.trim();
    const problemStatement = document.getElementById('problemStatement').value.trim();
    const goal = document.getElementById('goal').value.trim();

    // For CREATE: all core fields required
    if (!this.editingProjectId) {
      formData.name = name;
      formData.description = description;
      formData.problemStatement = problemStatement;
      formData.goal = goal;
      formData.projectCreationReasonType = document.getElementById('projectCreationReasonType').value;
      formData.projectCategory = document.getElementById('projectCategory').value;
      formData.projectType = document.getElementById('projectType').value;
    } else {
      // For UPDATE: only send fields that have actually changed
      if (name) formData.name = name;
      if (description) formData.description = description;
      if (problemStatement) formData.problemStatement = problemStatement;
      if (goal) formData.goal = goal;
      
      // Add required update reason
      formData.projectUpdationReasonType = 'other'; // Default reason for UI-based updates
    }

    // Add optional fields if they have values (for both CREATE and UPDATE)
    const expectedBudget = parseFloat(document.getElementById('expectedBudget').value);
    if (!isNaN(expectedBudget) && expectedBudget > 0) {
      formData.expectedBudget = Math.floor(expectedBudget);
    }

    const expectedTimeline = parseInt(document.getElementById('expectedTimelineInDays').value);
    if (!isNaN(expectedTimeline) && expectedTimeline >= 1 && expectedTimeline <= 120) {
      formData.expectedTimelineInDays = expectedTimeline;
    }

    const complexity = document.getElementById('projectComplexity')?.value;
    if (complexity) formData.projectComplexity = complexity;

    const criticality = document.getElementById('projectCriticality')?.value;
    if (criticality) formData.projectCriticality = criticality;

    const priority = document.getElementById('projectPriority')?.value;
    if (priority) formData.projectPriority = priority;

    // Validate
    const form = document.getElementById('projectForm');
    const validation = validateFormData(form, FORM_FIELDS.CREATE_PROJECT);
    if (!validation.isValid) {
      console.warn(`❌ [SUBMISSION #${submissionId}] Form validation failed`);
      Object.entries(validation.errors).forEach(([fieldId, message]) => {
        const errorEl = document.getElementById(`error-${fieldId}`);
        if (errorEl) errorEl.textContent = message;
      });
      this.isSubmitting = false; // Reset flag if validation fails
      this.currentSubmissionId = null;
      
      // Re-enable submit button on validation error
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
      return;
    }

    try {
      console.log(`📤 [SUBMISSION #${submissionId}] Submitting form...`);
      showToast(`${this.editingProjectId ? 'Updating' : 'Creating'} project...`, 'info');

      if (this.editingProjectId) {
        console.log(`✏️ [SUBMISSION #${submissionId}] Updating project:`, this.editingProjectId);
        await projectsService.updateProject(this.editingProjectId, formData);
        showToast('Project updated successfully', 'success');
      } else {
        console.log(`➕ [SUBMISSION #${submissionId}] Creating new project`);
        const newProject = await projectsService.createProject(formData);
        console.log(`✅ [SUBMISSION #${submissionId}] Project created:`, newProject._id);
        showToast('Project created successfully', 'success');
        store.setCurrentProject(newProject._id);
      }

      hideModal('projectModal');
      console.log(`🔄 [SUBMISSION #${submissionId}] Reloading projects list...`);
      await this.loadProjects();
    } catch (error) {
      console.error(`❌ [SUBMISSION #${submissionId}] Error during submission:`, error);
      showToast(error.message || 'Failed to save project', 'error');
    } finally {
      this.isSubmitting = false; // Reset flag to allow future submissions
      this.currentSubmissionId = null;
      
      // Re-enable submit button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
      console.log(`✅ [SUBMISSION #${submissionId}] Form submission completed`);
    }
  }

  async deleteProject(projectId) {
    // Store the projectId for the delete form submission
    this.projectToDelete = projectId;
    
    // Clear the delete form
    const deleteForm = document.getElementById('deleteProjectForm');
    if (deleteForm) {
      deleteForm.reset();
      deleteForm.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
      });
    }
    
    // Show the delete confirmation modal
    showModal('deleteProjectModal');
    
    // Set up one-time form submission handler
    const handleDeleteSubmit = async (e) => {
      e.preventDefault();
      
      const reasonType = document.getElementById('deletionReasonType').value;
      const reasonDescription = document.getElementById('deletionReasonDescription').value;
      
      console.log('[DELETE FORM] Reason Type:', reasonType);
      console.log('[DELETE FORM] Reason Description:', reasonDescription);
      
      // Validate reason type
      if (!reasonType) {
        const errorEl = document.getElementById('error-deletionReasonType');
        if (errorEl) {
          errorEl.textContent = 'Please select a deletion reason';
        }
        return;
      }
      
      try {
        showToast('Deleting project...', 'info');
        await projectsService.deleteProject(this.projectToDelete, reasonType, reasonDescription);
        showToast('Project deleted successfully', 'success');
        hideModal('deleteProjectModal');
        delete this.projectToDelete;
        deleteForm.removeEventListener('submit', handleDeleteSubmit);
        await this.loadProjects();
      } catch (error) {
        console.error('[DELETE ERROR]', error);
        const errorEl = document.getElementById('error-deletionReasonType');
        if (errorEl) {
          errorEl.textContent = error.message || 'Failed to delete project';
        }
        showToast(error.message || 'Failed to delete project', 'error');
      }
    };
    
    // Remove any existing listener first
    deleteForm.removeEventListener('submit', handleDeleteSubmit);
    deleteForm.addEventListener('submit', handleDeleteSubmit);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ProjectsPage();
  });
} else {
  new ProjectsPage();
}
