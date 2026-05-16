import { featuresService } from '../js/services/features.service.js';
import { store } from '../js/store/store.js';
import { showToast, showConfirmDialog, showModal, hideModal } from '../js/utils/helpers.js';
import { validateFormData } from '../js/utils/helpers.js';

const FEATURE_FORM_FIELDS = {
  title: {
    id: 'title',
    label: 'Feature title',
    required: true,
    validation: (value) => {
      const text = value?.trim() || '';
      if (text.length < 3) return 'Title must be at least 3 characters';
      if (text.length > 200) return 'Title cannot exceed 200 characters';
      return null;
    }
  },
  description: {
    id: 'description',
    label: 'Feature description',
    required: false,
    validation: (value) => {
      const text = value?.trim() || '';
      if (!text) return null;
      if (text.length < 10) return 'Description must be at least 10 characters';
      if (text.length > 2000) return 'Description cannot exceed 2000 characters';
      return null;
    }
  }
};

export class FeaturesPage {
  constructor() {
    this.features = [];
    this.editingId = null;
    this.init();
  }

  init() {
    this.attachEventListeners();
    this.loadFeatures();
  }

  attachEventListeners() {
    document.getElementById('btnAddFeature')?.addEventListener('click', () => this.openAddModal());
    document.getElementById('btnAddFeatureEmpty')?.addEventListener('click', () => this.openAddModal());
    document.getElementById('featureForm')?.addEventListener('submit', (e) => this.handleFormSubmit(e));
  }

  async loadFeatures() {
    try {
      // Get current project from store or localStorage
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;
      
      if (!projectId) {
        const savedProject = localStorage.getItem('CURRENT_PROJECT');
        if (savedProject) {
          try {
            const projectData = typeof savedProject === 'string' ? JSON.parse(savedProject) : savedProject;
            projectId = projectData?._id || projectData?.id || projectData;
            store.state.projects.current = projectData;
          } catch (e) {
            console.error('Failed to parse saved project:', e);
          }
        }
      }

      if (!projectId) {
        showToast('Please select a project', 'warning');
        return;
      }

      const data = await featuresService.getFeaturesByProject(projectId);
      this.features = Array.isArray(data) ? data : [];
      this.renderFeatures();
    } catch (error) {
      showToast(error.message || 'Failed to load features', 'error');
      // Initialize with empty array to prevent errors
      this.features = [];
    }
  }

  renderFeatures() {
    const container = document.getElementById('featuresTree');
    const empty = document.getElementById('emptyFeatures');

    if (this.features.length === 0) {
      container.classList.add('hidden');
      empty.classList.remove('hidden');
      return;
    }

    container.classList.remove('hidden');
    empty.classList.add('hidden');
    container.innerHTML = this.features.map(f => this.createFeatureNode(f)).join('');

    this.attachFeatureListeners();
  }

  createFeatureNode(feature) {
    const featureId = feature._id || feature.id || feature.hlfId || '';
    return `
      <div class="feature-node" data-feature-id="${featureId}">
        <div class="feature-header">
          <div class="feature-heading-block">
            <h3>${feature.title || feature.name || 'Untitled Feature'}</h3>
            <p class="feature-description">${feature.description || 'No description'}</p>
          </div>
          <div class="feature-badges">
            ${feature.priority ? `<span class="badge priority-${feature.priority}">${feature.priority}</span>` : ''}
            ${feature.complexity ? `<span class="badge">${feature.complexity}</span>` : ''}
          </div>
        </div>
        ${feature.estimatedEffort ? `<div class="feature-effort">Effort: ${feature.estimatedEffort}h</div>` : ''}
        <div class="feature-actions">
          <button class="btn-icon edit-feature">✏️</button>
          <button class="btn-icon delete-feature">🗑️</button>
        </div>
      </div>
    `;
  }

  attachFeatureListeners() {
    document.querySelectorAll('.feature-node').forEach(node => {
      const id = node.dataset.featureId;
      if (!id || id === 'undefined') return;
      node.querySelector('.edit-feature')?.addEventListener('click', () => this.openEditModal(id));
      node.querySelector('.delete-feature')?.addEventListener('click', () => this.deleteFeature(id));
    });
  }

  openAddModal() {
    this.editingId = null;
    document.getElementById('featureForm').reset();
    document.getElementById('featureModalTitle').textContent = 'Add Feature';
    showModal('featureModal');
  }

  openEditModal(id) {
    const feature = this.features.find(f => (f._id || f.id || f.hlfId) === id);
    if (!feature) return;

    this.editingId = id;
    document.getElementById('featureModalTitle').textContent = 'Edit Feature';
    document.getElementById('featureName').value = feature.title || feature.name || '';
    document.getElementById('featureDescription').value = feature.description || '';
    document.getElementById('featurePriority').value = feature.priority || '';
    document.getElementById('featureComplexity').value = feature.complexity || '';
    document.getElementById('featureEstimate').value = feature.estimatedEffort || '';

    showModal('featureModal');
  }

  async handleFormSubmit(event) {
    event.preventDefault();

    const formData = {
      title: document.getElementById('featureName').value,
      description: document.getElementById('featureDescription').value,
    };

    const validation = validateFormData(formData, FEATURE_FORM_FIELDS);
    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        const el = document.getElementById(`error-${field}`);
        if (el) el.textContent = message;
      });
      return;
    }

    try {
      let projectId = store.state.projects.current?._id || 
                     store.state.projects.current?.id || 
                     store.state.projects.current;
      
      if (!projectId) {
        const savedProject = localStorage.getItem('CURRENT_PROJECT');
        if (savedProject) {
          try {
            const projectData = typeof savedProject === 'string' ? JSON.parse(savedProject) : savedProject;
            projectId = projectData?._id || projectData?.id || projectData;
          } catch (e) {
            console.error('Failed to parse saved project:', e);
          }
        }
      }
      
      if (!projectId) {
        showToast('Project ID is required', 'error');
        return;
      }

      const normalizedTitle = formData.title.trim().toLowerCase();
      const matchingFeature = this.features.find(feature => {
        const existingTitle = (feature.title || feature.name || '').trim().toLowerCase();
        return existingTitle && existingTitle === normalizedTitle;
      });
      
      if (this.editingId) {
        await featuresService.updateFeature(this.editingId, formData);
        showToast('Feature updated', 'success');
      } else if (matchingFeature) {
        await featuresService.updateFeature(matchingFeature._id || matchingFeature.id || matchingFeature.hlfId, formData);
        showToast('Feature already existed, so it was updated', 'success');
      } else {
        await featuresService.createFeature(projectId, formData);
        showToast('Feature created', 'success');
      }

      hideModal('featureModal');
      await this.loadFeatures();
    } catch (error) {
      if (error?.status === 409) {
        showToast('High-level feature with this title already exists. Use a different title or edit the existing feature.', 'error');
        return;
      }
      showToast(error.message || 'Failed to save feature', 'error');
    }
  }

  async deleteFeature(id) {
    const confirmed = await showConfirmDialog('Delete this feature?');
    if (!confirmed) return;

    if (!id || id === 'undefined') {
      showToast('Feature ID is missing. Please reload the list and try again.', 'error');
      return;
    }

    try {
      await featuresService.deleteFeature(id, 'Deleted from dashboard');
      showToast('Feature deleted', 'success');
      await this.loadFeatures();
    } catch (error) {
      if (error?.status === 404) {
        showToast('Feature not found. Reload the list and try again.', 'error');
        return;
      }
      showToast(error.message || 'Failed to delete', 'error');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new FeaturesPage();
  });
} else {
  new FeaturesPage();
}
