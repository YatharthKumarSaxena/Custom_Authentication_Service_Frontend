import { commentsService } from '../js/services/comments.service.js';
import { showToast, showModal, hideModal, debounce } from '../js/utils/helpers.js';
import { requirementsService } from '../js/services/requirements.service.js';
import { scopeService } from '../js/services/scope.service.js';
import { featuresService } from '../js/services/features.service.js';
import productVisionService from '../js/services/product-vision.service.js';
import { store } from '../js/store/store.js';

const ENTITY_LABELS = {
    'scopes': 'Scopes',
    'requirements': 'Requirements',
    'inceptions': 'Inceptions',
    'high-level-features': 'High Level Features'
};

const ENTITY_LOADERS = {
    'scopes': async (projectId) => {
        const items = await scopeService.getScopesByProject(projectId);
        return (items || []).map((item) => ({
            id: item._id || item.id || item.scopeId,
            label: item.title || item.description || 'Untitled Scope',
        })).filter((item) => item.id);
    },
    'requirements': async (projectId) => {
        const items = await requirementsService.getRequirements(projectId, 1, 100);
        return (items || []).map((item) => ({
            id: item._id || item.id || item.requirementId,
            label: item.title || item.name || item.description || 'Untitled Requirement',
        })).filter((item) => item.id);
    },
    'inceptions': async (projectId) => {
        const items = await productVisionService.getProductVisions(projectId);
        return (items || []).map((item) => ({
            id: item.inceptionId || item._id || item.id,
            label: item.productVision ? `Product Vision: ${item.productVision}` : 'Project Inception',
        })).filter((item) => item.id);
    },
    'high-level-features': async (projectId) => {
        const items = await featuresService.getFeaturesByProject(projectId);
        return (items || []).map((item) => ({
            id: item._id || item.id || item.hlfId,
            label: item.title || item.name || 'Untitled Feature',
        })).filter((item) => item.id);
    },
};

class CommentsPage {
    constructor() {
        this.comments = [];
        this.filteredComments = [];
        this.entityType = 'scopes';
        this.entityId = '';
        this.availableEntities = [];
        this.currentProjectId = '';

        window.commentsPage = this;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeContext();
    }

    setupEventListeners() {
        document.getElementById('btnLoadComments')?.addEventListener('click', () => this.loadComments());
        document.getElementById('btnAddComment')?.addEventListener('click', () => this.openCommentModal());
        document.getElementById('commentForm')?.addEventListener('submit', (e) => this.handleCommentSubmit(e));
        document.getElementById('closeCommentModal')?.addEventListener('click', () => this.closeCommentModal());
        document.getElementById('cancelCommentBtn')?.addEventListener('click', () => this.closeCommentModal());
        document.getElementById('commentEntityType')?.addEventListener('change', (e) => {
            this.entityType = e.target.value;
            this.loadEntityOptions();
        });
        document.getElementById('commentEntityId')?.addEventListener('change', (e) => {
            this.entityId = e.target.value;
        });
        document.getElementById('searchComments')?.addEventListener('input', debounce(() => this.applyFilters(), 250));
        document.getElementById('filterType')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filterStatus')?.addEventListener('change', () => this.applyFilters());
        document.querySelector('#commentModal .modal-backdrop')?.addEventListener('click', () => this.closeCommentModal());
    }

    getCurrentProjectId() {
        let currentProjectId = store.state.projects.current?._id ||
            store.state.projects.current?.id ||
            store.state.projects.current;

        if (!currentProjectId) {
            const savedProject = localStorage.getItem('CURRENT_PROJECT');
            if (savedProject) {
                try {
                    const projectData = typeof savedProject === 'string' ? JSON.parse(savedProject) : savedProject;
                    currentProjectId = projectData?._id || projectData?.id || projectData;
                    store.state.projects.current = projectData;
                } catch (error) {
                    console.error('Failed to parse saved project:', error);
                }
            }
        }

        return currentProjectId;
    }

    initializeContext() {
        const entityTypeSelect = document.getElementById('commentEntityType');
        if (entityTypeSelect) {
            this.entityType = entityTypeSelect.value;
        }

        // Set page title and surface app version in console (non-blocking)
        try { document.title = 'SREMS | Comments'; } catch (e) {}
        try { console.info('[Page] CommentsPage init — app version', window?.SREMS_APP_VERSION || 'unknown'); } catch (e) {}

        this.currentProjectId = this.getCurrentProjectId();
        this.loadEntityOptions();
    }

    async loadEntityOptions() {
        const entitySelect = document.getElementById('commentEntityId');
        const hint = document.getElementById('commentEntityHint');

        if (!entitySelect) return;

        const loader = ENTITY_LOADERS[this.entityType];
        if (!loader) {
            entitySelect.innerHTML = '<option value="">No items available</option>';
            entitySelect.disabled = true;
            if (hint) hint.textContent = 'This entity type is not supported for comments.';
            return;
        }

        this.currentProjectId = this.getCurrentProjectId();
        if (!this.currentProjectId) {
            entitySelect.innerHTML = '<option value="">Select a project first</option>';
            entitySelect.disabled = true;
            if (hint) hint.textContent = 'Open a project first so comment targets can be loaded.';
            return;
        }

        entitySelect.disabled = true;
        entitySelect.innerHTML = '<option value="">Loading items...</option>';
        if (hint) hint.textContent = `Loading ${ENTITY_LABELS[this.entityType] || 'items'} from the current project...`;

        try {
            const items = await loader(this.currentProjectId);
            this.availableEntities = Array.isArray(items) ? items : [];

            if (!this.availableEntities.length) {
                entitySelect.innerHTML = '<option value="">No items found</option>';
                entitySelect.disabled = true;
                if (hint) hint.textContent = `No ${ENTITY_LABELS[this.entityType] || 'items'} found in this project yet.`;
                this.clearInitialSpinner();
                return;
            }

            entitySelect.innerHTML = [
                '<option value="">Select an item</option>',
                ...this.availableEntities.map((item) => `<option value="${item.id}">${item.label}</option>`)
            ].join('');
            entitySelect.disabled = false;

            const savedEntityId = this.entityId && this.availableEntities.some((item) => item.id === this.entityId)
                ? this.entityId
                : this.availableEntities.length === 1
                    ? this.availableEntities[0].id
                    : '';

            if (savedEntityId) {
                entitySelect.value = savedEntityId;
                this.entityId = savedEntityId;
                this.loadComments();
            } else {
                this.clearInitialSpinner();
            }

            if (hint) hint.textContent = `Choose from the ${ENTITY_LABELS[this.entityType] || 'available items'} in this project. IDs are hidden.`;
        } catch (error) {
            entitySelect.innerHTML = '<option value="">Failed to load items</option>';
            entitySelect.disabled = true;
            if (hint) hint.textContent = 'Unable to load items for this entity type.';
            console.error('Failed to load comment entity options:', error);
            this.clearInitialSpinner();
        }
    }

    clearInitialSpinner() {
        const container = document.getElementById('commentsList');
        if (container && container.innerHTML.includes('spinner')) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <h3>Comments</h3>
                    <p>Select a project item and click "Load" to view comments.</p>
                </div>
            `;
        }
    }

    async loadComments() {
        try {
            const entityIdSelect = document.getElementById('commentEntityId');
            this.entityId = entityIdSelect?.value?.trim() || '';

            if (!this.entityId) {
                showToast('Please select a project item to load comments', 'warning');
                return;
            }

            const container = document.getElementById('commentsList');
            container.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading comments...</p></div>';

            const response = await commentsService.listHierarchical(this.entityType, this.entityId);
            this.comments = Array.isArray(response) ? response : [];
            this.applyFilters();
        } catch (error) {
            showToast(error.message || 'Failed to load comments', 'error');
            this.comments = [];
            this.filteredComments = [];
            this.renderComments();
        }
    }

    applyFilters() {
        const search = document.getElementById('searchComments')?.value?.toLowerCase() || '';
        const typeFilter = document.getElementById('filterType')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';

        const matches = (comment, depth = 0) => {
            const commentText = (comment.commentText || '').toLowerCase();
            const userId = (comment.createdBy || comment.userId || '').toLowerCase();
            const hasReplies = (comment.childComments || comment.replies || []).length > 0;

            const typeOk = !typeFilter || (typeFilter === 'root' ? depth === 0 : depth > 0);
            const statusOk = !statusFilter || (statusFilter === 'has-replies' ? hasReplies : !hasReplies);
            const searchOk = !search || commentText.includes(search) || userId.includes(search);
            return typeOk && statusOk && searchOk;
        };

        const filterTree = (items, depth = 0) => {
            return (items || []).reduce((acc, item) => {
                const children = filterTree(item.childComments || item.replies || [], depth + 1);
                if (matches(item, depth) || children.length > 0) {
                    acc.push({ ...item, childComments: children });
                }
                return acc;
            }, []);
        };

        this.filteredComments = filterTree(this.comments);
        this.renderComments();
    }

    renderComments() {
        const container = document.getElementById('commentsList');
        if (!container) return;

        if (!this.filteredComments.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <h3>No Comments Found</h3>
                    <p>Load comments for a valid entity ID, or add a new comment.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredComments.map((comment) => this.renderCommentNode(comment)).join('');
        this.attachCommentActions();
    }

    renderCommentNode(comment, depth = 0) {
        const commentId = comment._id || comment.id;
        const createdAt = comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'N/A';
        const replies = comment.childComments || comment.replies || [];

        return `
            <div class="comment-card" style="margin-left: ${depth * 20}px;">
                <div class="comment-header">
                    <strong>${comment.createdBy || comment.userId || 'Unknown User'}</strong>
                    <span>${createdAt}</span>
                </div>
                <p>${comment.commentText || ''}</p>
                <div class="comment-actions">
                    <button class="btn btn-sm btn-primary btn-reply" data-id="${commentId}">Reply</button>
                    <button class="btn btn-sm btn-secondary btn-edit" data-id="${commentId}">Edit</button>
                    <button class="btn btn-sm btn-danger btn-delete" data-id="${commentId}">Delete</button>
                </div>
            </div>
            ${replies.map((child) => this.renderCommentNode(child, depth + 1)).join('')}
        `;
    }

    attachCommentActions() {
        document.querySelectorAll('.btn-reply').forEach((btn) => {
            btn.addEventListener('click', () => this.openCommentModal(btn.dataset.id));
        });

        document.querySelectorAll('.btn-edit').forEach((btn) => {
            btn.addEventListener('click', () => this.editComment(btn.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach((btn) => {
            btn.addEventListener('click', () => this.deleteComment(btn.dataset.id));
        });
    }

    openCommentModal(parentCommentId = '') {
        document.getElementById('commentForm')?.reset();
        const entityTypeSelect = document.getElementById('commentEntityType');
        this.entityType = entityTypeSelect?.value || this.entityType;
        const entityIdSelect = document.getElementById('commentEntityId');
        this.entityId = entityIdSelect?.value || this.entityId;

        if (!this.entityId) {
            showToast('Select a project item first', 'warning');
            return;
        }

        document.getElementById('parentCommentId').value = parentCommentId;
        showModal('commentModal');
    }

    closeCommentModal() {
        hideModal('commentModal');
        document.getElementById('commentForm')?.reset();
    }

    async handleCommentSubmit(event) {
        event.preventDefault();
        try {
            this.entityType = document.getElementById('commentEntityType')?.value || this.entityType;
            this.entityId = document.getElementById('commentEntityId')?.value?.trim() || this.entityId;

            if (!this.entityId) {
                showToast('Please select a project item first', 'warning');
                return;
            }

            const commentText = document.getElementById('commentText')?.value?.trim();
            const parentCommentId = document.getElementById('parentCommentId')?.value?.trim();

            if (!commentText) {
                showToast('Comment text is required', 'warning');
                return;
            }

            await commentsService.createComment(this.entityType, this.entityId, {
                commentText,
                parentCommentId: parentCommentId || undefined
            });

            showToast('Comment saved successfully', 'success');
            this.closeCommentModal();
            await this.loadComments();
        } catch (error) {
            showToast(error.message || 'Failed to save comment', 'error');
        }
    }

    async editComment(commentId) {
        const existing = this.findCommentById(this.comments, commentId);
        const updatedText = window.prompt('Update comment text', existing?.commentText || '');

        if (updatedText === null) {
            return;
        }

        if (!updatedText.trim()) {
            showToast('Comment text is required', 'warning');
            return;
        }

        try {
            await commentsService.updateComment(commentId, { commentText: updatedText.trim() });
            showToast('Comment updated', 'success');
            await this.loadComments();
        } catch (error) {
            showToast(error.message || 'Failed to update comment', 'error');
        }
    }

    async deleteComment(commentId) {
        if (!window.confirm('Delete this comment?')) {
            return;
        }

        try {
            await commentsService.deleteComment(commentId, 'Deleted from comments page');
            showToast('Comment deleted', 'success');
            await this.loadComments();
        } catch (error) {
            showToast(error.message || 'Failed to delete comment', 'error');
        }
    }

    findCommentById(items, id) {
        for (const item of items || []) {
            if ((item._id || item.id) === id) {
                return item;
            }
            const found = this.findCommentById(item.childComments || item.replies || [], id);
            if (found) {
                return found;
            }
        }
        return null;
    }
}

export { CommentsPage };
