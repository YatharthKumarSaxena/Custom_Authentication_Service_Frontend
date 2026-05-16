import { showToast, debounce, showConfirmDialog } from '../js/utils/helpers.js';
import productVisionService from '../js/services/product-vision.service.js';
import { store } from '../js/store/store.js';

export class ProductVisionPage {
  constructor() {
    this.visions = [];
    this.filteredVisions = [];
    this.init();
  }

  getCurrentProjectId() {
    let currentProjectId = store.state.projects.current?._id || 
                          store.state.projects.current?.id || 
                          store.state.projects.current;

    if (!currentProjectId) {
      const storedProject = localStorage.getItem('CURRENT_PROJECT');
      if (storedProject) {
        try {
          const projectData = typeof storedProject === 'string' ? JSON.parse(storedProject) : storedProject;
          currentProjectId = projectData?._id || projectData?.id || projectData;
          store.state.projects.current = projectData;
        } catch (e) {
          console.error('Failed to parse saved project:', e);
        }
      }
    }

    return currentProjectId;
  }

  init() {
    this.attachEventListeners();
    this.loadProductVisions();
  }

  attachEventListeners() {
    document.getElementById('btnCreateProductVision')?.addEventListener('click', () => this.openCreateModal());
    document.getElementById('btnCreateProductVisionEmpty')?.addEventListener('click', () => this.openCreateModal());
    
    document.getElementById('filterVisionStatus')?.addEventListener('change', () => this.applyFilters());
    document.getElementById('searchProductVision')?.addEventListener('input', debounce(() => this.applyFilters(), 300));
  }

  async loadProductVisions() {
    try {
      const container = document.getElementById('productVisionContainer');
      container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading product vision documents...</p></div>';

      const currentProjectId = this.getCurrentProjectId();

      if (!currentProjectId) {
        showToast('No project selected. Please go back and select a project.', 'error');
        this.visions = [];
        this.filteredVisions = [];
        this.showEmptyState();
        return;
      }

      console.log('🔍 Loading product vision for project:', currentProjectId);
      const data = await productVisionService.getProductVisions(currentProjectId);
      
      this.visions = Array.isArray(data) ? data : [];
      this.filteredVisions = [...this.visions];
      
      if (this.visions.length === 0) {
        console.log('ℹ️ No product vision found for project');
        showToast('No product vision created yet. Create one to get started.', 'info');
      }
      
      this.renderProductVisions();
    } catch (error) {
      console.error('Failed to load product visions:', error);
      showToast(error.message || 'Failed to load product vision documents', 'error');
      this.showEmptyState();
    }
  }

  applyFilters() {
    const status = document.getElementById('filterVisionStatus').value;
    const search = document.getElementById('searchProductVision').value.toLowerCase();

    this.filteredVisions = this.visions.filter(item => {
      const itemStatus = item.isDeleted ? 'deleted' : (item.isFrozen ? 'frozen' : 'active');
      const statusMatch = !status || itemStatus === status;
      const searchMatch = !search || 
        item.productVision?.toLowerCase().includes(search) ||
        item.versionNumber?.toLowerCase().includes(search);
      return statusMatch && searchMatch;
    });

    this.renderProductVisions();
  }

  renderProductVisions() {
    const container = document.getElementById('productVisionContainer');
    const emptyState = document.getElementById('emptyProductVision');

    // Ensure filteredVisions is an array
    const visions = Array.isArray(this.filteredVisions) ? this.filteredVisions : [];

    if (visions.length === 0) {
      this.showEmptyState();
      return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = visions.map(item => {
      // Safe date parsing
      let createdDate = 'N/A';
      try {
        if (item.createdAt) {
          const dateObj = new Date(item.createdAt);
          if (!isNaN(dateObj.getTime())) {
            createdDate = dateObj.toLocaleDateString();
          }
        }
      } catch (e) {
        console.error('Date parsing error:', e);
        createdDate = 'N/A';
      }

      // Map backend fields to display fields
      const displayItem = {
        id: item._id || item.id,
        title: `Product Vision ${item.versionNumber ? `v${item.versionNumber}` : ''}`.trim(),
        status: item.isFrozen ? 'Frozen' : (item.isDeleted ? 'Deleted' : 'Active'),
        productVision: item.productVision || 'Not defined',
        createdAt: createdDate
      };

      return `
        <div class="card vision-card">
          <div class="card-header">
            <h3>${displayItem.title}</h3>
            <span class="status-badge status-${displayItem.status.toLowerCase()}">${displayItem.status}</span>
          </div>
          <div class="card-body">
            <p><strong>Vision:</strong> ${displayItem.productVision}</p>
            <p><strong>Created:</strong> ${displayItem.createdAt}</p>
          </div>
          <div class="card-actions">
            <button class="btn btn-sm btn-primary btnViewProductVision" data-id="${displayItem.id}">View</button>
            <button class="btn btn-sm btn-warning btnEditProductVision" data-id="${displayItem.id}">Edit</button>
            <button class="btn btn-sm btn-danger btnDeleteProductVision" data-id="${displayItem.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to buttons
    this.attachRenderEventListeners();
  }

  attachRenderEventListeners() {
    // View buttons
    document.querySelectorAll('.btnViewProductVision')?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        console.log('View product vision:', id);
        // TODO: Open detail view
      });
    });

    // Edit buttons
    document.querySelectorAll('.btnEditProductVision')?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        this.openEditModal(id);
      });
    });

    // Delete buttons
    document.querySelectorAll('.btnDeleteProductVision')?.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        console.log('Delete product vision:', id);
        const confirmed = await showConfirmDialog('Delete Product Vision', 'This action cannot be undone. Are you sure?');
        if (confirmed) {
          try {
            const projectId = this.getCurrentProjectId();
            await productVisionService.deleteProductVision(projectId, 'Deleted from frontend');
            showToast('Product vision deleted successfully', 'success');
            await this.loadProductVisions();
          } catch (error) {
            showToast(error.message || 'Failed to delete product vision', 'error');
          }
        }
      });
    });
  }

  showEmptyState() {
    document.getElementById('emptyProductVision')?.classList.remove('hidden');
    document.getElementById('productVisionContainer').innerHTML = '';
  }

  openCreateModal() {
    this.openEditModal();
  }

  async openEditModal(id = null) {
    try {
      const projectId = this.getCurrentProjectId();
      if (!projectId) {
        showToast('No project selected', 'error');
        return;
      }

      const existing = id ? this.visions.find(v => (v._id || v.id) === id) : this.visions[0];
      const existingText = existing?.productVision || '';
      const value = window.prompt('Enter product vision', existingText);

      if (value === null) {
        return;
      }

      const productVision = value.trim();
      if (!productVision) {
        showToast('Product vision is required', 'error');
        return;
      }

      if (existing) {
        await productVisionService.updateProductVision(projectId, { productVision });
        showToast('Product vision updated', 'success');
      } else {
        await productVisionService.createProductVision({ projectId, productVision });
        showToast('Product vision created', 'success');
      }

      await this.loadProductVisions();
    } catch (error) {
      showToast(error.message || 'Failed to save product vision', 'error');
    }
  }
}
