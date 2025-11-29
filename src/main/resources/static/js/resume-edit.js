document.addEventListener('DOMContentLoaded', () => {
    // 융합프로젝트 김태형 12주차 : 좌측 입력 폼과 우측 미리보기를 실시간으로 동기화 + 경력/프로젝트 동적 추가, 템플릿 캐러셀, 내 초안 페이지 이동, 로그인 사용자 정보 표시

    /* ---------- 공통: 입력값 ↔ 미리보기 바인딩 ---------- */

    function bindField(inputId, previewId) {
        const inputEl = document.getElementById(inputId);
        const previewEl = document.getElementById(previewId);
        if (!inputEl || !previewEl) return;

        const handler = (e) => {
            previewEl.textContent = e.target.value || '';
        };

        inputEl.addEventListener('input', handler);

        // 초기 값 반영
        if (inputEl.value) {
            previewEl.textContent = inputEl.value;
        }
    }

    // 기본 정보
    bindField('input-name', 'preview-name');
    bindField('input-phone', 'preview-phone');
    bindField('input-email', 'preview-email');
    bindField('input-birth', 'preview-birth');
    bindField('input-summary', 'preview-summary');

    // 학력
    bindField('input-edu-school', 'preview-edu-school');
    bindField('input-edu-period', 'preview-edu-period');

    // 경력 1
    bindField('input-exp1-company', 'preview-exp1-company');
    bindField('input-exp1-position', 'preview-exp1-position');
    bindField('input-exp1-period', 'preview-exp1-period');
    bindField('input-exp1-desc', 'preview-exp1-desc');

    // 프로젝트 1
    bindField('input-proj1-name', 'preview-proj1-name');
    bindField('input-proj1-period', 'preview-proj1-period');
    bindField('input-proj1-desc', 'preview-proj1-desc');

    /* ---------- 학력 (전공 + 학위) 병합 ---------- */

    function updateEducation() {
        const majorEl = document.getElementById('input-edu-major');
        const degreeEl = document.getElementById('input-edu-degree');
        const previewEl = document.getElementById('preview-edu-major');

        if (!majorEl || !degreeEl || !previewEl) return;

        const major = majorEl.value.trim();
        const degree = degreeEl.value.trim();

        let text = major;
        if (degree) {
            text += (major ? ' / ' : '') + degree;
        }
        previewEl.textContent = text;
    }

    const eduMajorInput = document.getElementById('input-edu-major');
    const eduDegreeInput = document.getElementById('input-edu-degree');
    if (eduMajorInput) eduMajorInput.addEventListener('input', updateEducation);
    if (eduDegreeInput) eduDegreeInput.addEventListener('input', updateEducation);
    updateEducation(); // 초기값 반영

    /* ---------- 프로젝트 (역할 + 기술) 병합 ---------- */

    function updateProjectSub(num) {
        const roleEl = document.getElementById(`input-proj${num}-role`);
        const techEl = document.getElementById(`input-proj${num}-tech`);
        const previewEl = document.getElementById(`preview-proj${num}-role`);

        if (!roleEl || !techEl || !previewEl) return;

        const role = roleEl.value.trim();
        const tech = techEl.value.trim();

        let text = role;
        if (tech) {
            text += (role ? ' · ' : '') + tech;
        }
        previewEl.textContent = text;
    }

    function setupProjectRoleTechBinding(num) {
        const roleInput = document.getElementById(`input-proj${num}-role`);
        const techInput = document.getElementById(`input-proj${num}-tech`);

        if (roleInput) {
            roleInput.addEventListener('input', () => updateProjectSub(num));
        }
        if (techInput) {
            techInput.addEventListener('input', () => updateProjectSub(num));
        }

        updateProjectSub(num);
    }

    // 프로젝트 1 역할+기술 바인딩
    setupProjectRoleTechBinding(1);

    /* ---------- 사진 업로드 미리보기 ---------- */

    const photoInput = document.getElementById('input-photo');
    const photoBox = document.getElementById('preview-photo-box');

    if (photoInput && photoBox) {
        photoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (event) {
                photoBox.innerHTML = `<img src="${event.target.result}" alt="사진">`;
            };
            reader.readAsDataURL(file);
        });
    }

    /* ---------- 기술 스택 (쉼표 → 태그) ---------- */

    const skillInput = document.getElementById('input-skill-list');
    const skillListPreview = document.getElementById('preview-skill-list');

    if (skillInput && skillListPreview) {
        const renderSkills = (text) => {
            const skills = text
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

            skillListPreview.innerHTML = '';

            skills.forEach((skill) => {
                const span = document.createElement('span');
                span.className = 'resume-tag';
                span.textContent = skill;
                skillListPreview.appendChild(span);
            });
        };

        skillInput.addEventListener('input', (e) => {
            renderSkills(e.target.value);
        });

        if (skillInput.value) {
            renderSkills(skillInput.value);
        }
    }

    /* ---------- 로그인 정보 자동 채우기 (더미) ---------- */

    const fillBtn = document.getElementById('fill-from-user-btn');
    if (fillBtn) {
        fillBtn.addEventListener('click', () => {
            const nameEl = document.getElementById('input-name');
            const emailEl = document.getElementById('input-email');
            const phoneEl = document.getElementById('input-phone');

            if (!nameEl || !emailEl || !phoneEl) return;

            nameEl.value = '홍길동';
            emailEl.value = 'user@example.com';
            phoneEl.value = '010-1234-5678';

            nameEl.dispatchEvent(new Event('input'));
            emailEl.dispatchEvent(new Event('input'));
            phoneEl.dispatchEvent(new Event('input'));
        });
    }

    /* ---------- 경력 추가 동적 UI ---------- */

    const MAX_EXP = 5;
    let expCount = 1;

    const experienceContainer = document.getElementById('experience-container');
    const previewExperienceList = document.getElementById('preview-experience-list');
    const addExperienceBtn = document.getElementById('add-experience-btn');

    if (experienceContainer && previewExperienceList && addExperienceBtn) {
        addExperienceBtn.addEventListener('click', () => {
            if (expCount >= MAX_EXP) {
                alert(`경력은 최대 ${MAX_EXP}개까지 추가할 수 있습니다.`);
                return;
            }

            const newIndex = expCount + 1;

            const baseGroup = experienceContainer.querySelector('.experience-group[data-exp-index="1"]');
            const basePreview = previewExperienceList.querySelector('.resume-item[data-exp-index="1"]');
            if (!baseGroup || !basePreview) return;

            // 폼 쪽 복제
            const groupClone = baseGroup.cloneNode(true);
            groupClone.dataset.expIndex = String(newIndex);

            const labelEl = groupClone.querySelector('.sub-section-label');
            if (labelEl) labelEl.textContent = `경력 ${newIndex}`;

            const inputs = groupClone.querySelectorAll('input, textarea');
            inputs.forEach((input) => {
                const oldId = input.id;
                if (!oldId) return;

                const newId = oldId.replace('exp1', `exp${newIndex}`);
                input.id = newId;
                input.value = '';

                const label = groupClone.querySelector(`label[for="${oldId}"]`);
                if (label) {
                    label.setAttribute('for', newId);
                }
            });

            experienceContainer.appendChild(groupClone);

            // 미리보기 쪽 복제
            const previewClone = basePreview.cloneNode(true);
            previewClone.dataset.expIndex = String(newIndex);

            const previewElements = previewClone.querySelectorAll('[id]');
            previewElements.forEach((el) => {
                const oldId = el.id;
                if (oldId.startsWith('preview-exp1-')) {
                    const newId = oldId.replace('preview-exp1-', `preview-exp${newIndex}-`);
                    el.id = newId;
                    el.textContent = '';
                }
            });

            previewExperienceList.appendChild(previewClone);

            // 새로 만들어진 경력 필드 바인딩
            bindField(`input-exp${newIndex}-company`, `preview-exp${newIndex}-company`);
            bindField(`input-exp${newIndex}-position`, `preview-exp${newIndex}-position`);
            bindField(`input-exp${newIndex}-period`, `preview-exp${newIndex}-period`);
            bindField(`input-exp${newIndex}-desc`, `preview-exp${newIndex}-desc`);

            expCount = newIndex;
        });
    }

    /* ---------- 프로젝트 추가 동적 UI ---------- */

    const MAX_PROJ = 5;
    let projCount = 1;

    const projectContainer = document.getElementById('project-container');
    const previewProjectList = document.getElementById('preview-project-list');
    const addProjectBtn = document.getElementById('add-project-btn');

    if (projectContainer && previewProjectList && addProjectBtn) {
        addProjectBtn.addEventListener('click', () => {
            if (projCount >= MAX_PROJ) {
                alert(`프로젝트는 최대 ${MAX_PROJ}개까지 추가할 수 있습니다.`);
                return;
            }

            const newIndex = projCount + 1;

            const baseGroup = projectContainer.querySelector('.project-group[data-proj-index="1"]');
            const basePreview = previewProjectList.querySelector('.resume-item[data-proj-index="1"]');
            if (!baseGroup || !basePreview) return;

            // 폼 쪽 복제
            const groupClone = baseGroup.cloneNode(true);
            groupClone.dataset.projIndex = String(newIndex);

            const labelEl = groupClone.querySelector('.sub-section-label');
            if (labelEl) labelEl.textContent = `프로젝트 ${newIndex}`;

            const inputs = groupClone.querySelectorAll('input, textarea');
            inputs.forEach((input) => {
                const oldId = input.id;
                if (!oldId) return;

                const newId = oldId.replace('proj1', `proj${newIndex}`);
                input.id = newId;
                input.value = '';

                const label = groupClone.querySelector(`label[for="${oldId}"]`);
                if (label) {
                    label.setAttribute('for', newId);
                }
            });

            projectContainer.appendChild(groupClone);

            // 미리보기 쪽 복제
            const previewClone = basePreview.cloneNode(true);
            previewClone.dataset.projIndex = String(newIndex);

            const previewElements = previewClone.querySelectorAll('[id]');
            previewElements.forEach((el) => {
                const oldId = el.id;
                if (oldId.startsWith('preview-proj1-')) {
                    const newId = oldId.replace('preview-proj1-', `preview-proj${newIndex}-`);
                    el.id = newId;
                    el.textContent = '';
                }
            });

            previewProjectList.appendChild(previewClone);

            // 새로 만들어진 프로젝트 필드 바인딩
            bindField(`input-proj${newIndex}-name`, `preview-proj${newIndex}-name`);
            bindField(`input-proj${newIndex}-period`, `preview-proj${newIndex}-period`);
            bindField(`input-proj${newIndex}-desc`, `preview-proj${newIndex}-desc`);
            setupProjectRoleTechBinding(newIndex);

            projCount = newIndex;
        });
    }

    /* ---------- 템플릿 캐러셀 (<, >, 점 6개) ---------- */

    // 융합프로젝트 김태형 12주차 : 6개의 이력서 템플릿을 좌우 버튼과 점(인디케이터)로 전환하는 기능
    const TEMPLATE_COUNT = 6;
    let currentTemplateIndex = 0; // 0 ~ 5

    const templateIndicator = document.getElementById('template-indicator');
    const prevTemplateBtn = document.getElementById('prev-template');
    const nextTemplateBtn = document.getElementById('next-template');
    const templateDots = document.querySelectorAll('.template-dot');
    const resumeWrapper = document.querySelector('.resume-wrapper');

    function applyTemplate(index) {
        currentTemplateIndex = index;

        if (templateIndicator) {
            templateIndicator.textContent =
                (index + 1) + ' / ' + TEMPLATE_COUNT;
        }

        templateDots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });

        if (resumeWrapper) {
            for (let i = 0; i < TEMPLATE_COUNT; i++) {
                resumeWrapper.classList.remove('template-' + (i + 1));
            }
            resumeWrapper.classList.add('template-' + (index + 1));
        }
    }

    if (prevTemplateBtn) {
        prevTemplateBtn.addEventListener('click', () => {
            const nextIndex =
                (currentTemplateIndex - 1 + TEMPLATE_COUNT) % TEMPLATE_COUNT;
            applyTemplate(nextIndex);
        });
    }

    if (nextTemplateBtn) {
        nextTemplateBtn.addEventListener('click', () => {
            const nextIndex =
                (currentTemplateIndex + 1) % TEMPLATE_COUNT;
            applyTemplate(nextIndex);
        });
    }

    templateDots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const idx = parseInt(dot.dataset.index, 10) || 0;
            applyTemplate(idx);
        });
    });

    applyTemplate(0); // 초기 템플릿 1번

    /* ---------- 이력서 목록(내 초안) 페이지로 이동 ---------- */

    // 융합프로젝트 김태형 12주차 : 상단 "이력서 목록으로" 버튼 클릭 시 내 초안 리스트(Make.html)로 이동
    const backToListBtn = document.getElementById('back-to-list-btn');
    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            // TODO: 백엔드 라우팅에 맞게 URL 조정 (/resume/make 는 예시)
            window.location.href = '/resume/make';
        });
    }

    /* ---------- 로그인한 사용자 정보 우측 상단 표시 ---------- */

    // 융합프로젝트 김태형 12주차 : 백엔드에서 현재 로그인한 사용자 정보를 가져와 상단 우측에 이름/이메일 출력
    function loadCurrentUserInfo() {
        const nameEl = document.getElementById('current-user-name');
        const emailEl = document.getElementById('current-user-email');
        if (!nameEl || !emailEl) return;

        const baseUrl = window.API_BASE_URL || ''; // env.js 에서 세팅해둔 값 사용(없으면 상대경로)

        fetch(baseUrl + '/api/users/me', {
            method: 'GET',
            credentials: 'include'
        })
            .then((res) => {
                if (!res.ok) {
                    throw new Error('failed to fetch current user');
                }
                return res.json();
            })
            .then((data) => {
                // 응답 예시: { name, email } 또는 { data: { name, email } }
                const user = data.data || data;
                if (user.name) {
                    nameEl.textContent = user.name;
                }
                if (user.email) {
                    emailEl.textContent = user.email;
                }
            })
            .catch(() => {
                // 실패하면 기본 더미 텍스트(홍길동 / user@example.com) 유지
            });
    }

    loadCurrentUserInfo();
});
