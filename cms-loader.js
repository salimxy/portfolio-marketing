// CMS Project Loader
// This script loads projects from markdown files and displays them dynamically

class ProjectLoader {
    constructor() {
        this.projects = [];
        this.currentFilter = 'all';
    }

    async init() {
        try {
            await this.loadProjects();
            this.renderProjects();
            this.setupFilters();
        } catch (error) {
            console.warn('CMS projects not available, using fallback static projects');
            // Fallback to static projects if CMS is not available
            this.initFallbackProjects();
        }
    }

    async loadProjects() {
        // Get list of project files
        const projectFiles = [
            'croissance-ecommerce-mode.md',
            'lancement-saas-b2b.md',
            'digitalisation-restaurant.md',
            'repositionnement-marque.md'
        ];

        const projectPromises = projectFiles.map(file => this.loadProject(file));
        const projects = await Promise.all(projectPromises);

        // Filter out null results and sort by order
        this.projects = projects
            .filter(project => project !== null)
            .sort((a, b) => a.order - b.order);
    }

    async loadProject(filename) {
        try {
            const response = await fetch(`/content/projects/${filename}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const content = await response.text();
            return this.parseMarkdown(content);
        } catch (error) {
            console.warn(`Could not load project: ${filename}`, error);
            return null;
        }
    }

    parseMarkdown(content) {
        // Extract YAML front matter
        const frontMatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
        if (!frontMatterMatch) return null;

        const frontMatter = frontMatterMatch[1];
        const project = this.parseYAML(frontMatter);

        return project;
    }

    parseYAML(yamlString) {
        const lines = yamlString.split('\n');
        const result = {};
        let currentKey = null;
        let currentObject = null;
        let currentArray = null;
        let indent = 0;

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            const lineIndent = line.length - line.trimStart().length;

            if (trimmed.includes(': ') && !trimmed.startsWith('-')) {
                const [key, ...valueParts] = trimmed.split(': ');
                const value = valueParts.join(': ').replace(/['"]/g, '');

                if (lineIndent === 0) {
                    currentKey = key;
                    if (value) {
                        result[key] = value;
                        currentObject = null;
                        currentArray = null;
                    } else {
                        result[key] = {};
                        currentObject = result[key];
                        currentArray = null;
                    }
                } else if (currentObject) {
                    if (value) {
                        currentObject[key] = value;
                    } else {
                        currentObject[key] = [];
                        currentArray = currentObject[key];
                    }
                }
            } else if (trimmed.startsWith('- ') && currentArray) {
                const value = trimmed.substring(2).replace(/['"]/g, '');
                currentArray.push(value);
            } else if (trimmed.startsWith('- ') && currentKey) {
                const value = trimmed.substring(2).replace(/['"]/g, '');
                if (!Array.isArray(result[currentKey])) {
                    result[currentKey] = [];
                }
                result[currentKey].push(value);
                currentArray = result[currentKey];
            }
        }

        return result;
    }

    renderProjects() {
        const projectsGrid = document.querySelector('.projects-grid');
        if (!projectsGrid) return;

        // Clear existing projects
        projectsGrid.innerHTML = '';

        const filteredProjects = this.currentFilter === 'all'
            ? this.projects
            : this.projects.filter(project => project.category === this.currentFilter);

        filteredProjects.forEach(project => {
            const projectCard = this.createProjectCard(project);
            projectsGrid.appendChild(projectCard);
        });

        // Re-apply animations
        this.applyAnimations();
    }

    createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.setAttribute('data-category', project.category);

        card.innerHTML = `
            <div class="project-header">
                <h3>${project.title}</h3>
                <p class="project-client">${project.client_type}</p>
            </div>

            <div class="project-section project-objective">
                <h4>Objectif</h4>
                <p>${project.objective?.description || ''}</p>
            </div>

            <div class="project-section project-process">
                <h4>Processus</h4>
                <ol>
                    ${(project.process?.steps || []).map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>

            <div class="project-section project-results">
                <h4>Résultats</h4>
                <p><strong>${project.results?.description || ''}</strong></p>
            </div>

            <div class="project-tags">
                ${(project.tags || []).map(tag => `<span class="project-tag">${tag}</span>`).join('')}
            </div>
        `;

        return card;
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                // Add active class to clicked button
                button.classList.add('active');

                this.currentFilter = button.getAttribute('data-filter');
                this.renderProjects();
            });
        });
    }

    applyAnimations() {
        // Re-apply hover effects and animations
        document.querySelectorAll('.project-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
    }

    initFallbackProjects() {
        // Keep the original static projects as fallback
        console.log('Using static project fallback');
        this.setupFilters();
        this.applyAnimations();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const projectLoader = new ProjectLoader();
    projectLoader.init();
});

// Export for potential use in other scripts
window.ProjectLoader = ProjectLoader;