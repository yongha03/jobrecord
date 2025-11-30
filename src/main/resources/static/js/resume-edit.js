document.addEventListener('DOMContentLoaded', () => {
    // 융합프로젝트 김태형 12주차 : 좌측 입력 폼과 우측 미리보기를 실시간으로 동기화 + 경력/프로젝트 동적 추가, 템플릿 캐러셀, 내 초안 페이지 이동, 로그인 사용자 정보 표시

    // 융합프로젝트 김태형 12주차 : 이력서 ID 파라미터 추출 + API 공통 유틸 + 섹션(학력/경력/프로젝트/스킬) 저장 로직

    const hasAuth = (window.Auth && typeof window.Auth.apiFetch === 'function');

    function getResumeIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('resumeId');
        return id ? Number(id) : null;
    }

    const resumeId = getResumeIdFromUrl();

    // 융합프로젝트 김태형 12주차 : 이력서 공개 여부(isPublic)와 요약(summary)를 저장해 두는 메타 캐시
    let resumeMeta = {
        isPublic: false,
        summary: ''
    };

    function parsePeriod(text) {
        if (!text) {
            return { startDate: null, endDate: null, isCurrent: false };
        }

        const parts = text.split('~').map((p) => p.trim());
        const startRaw = parts[0] || '';
        const endRaw = parts[1] || '';

        function toDateStr(raw) {
            const m = raw.match(/(\d{4})[.\-\/](\d{1,2})(?:[.\-\/](\d{1,2}))?/);
            if (!m) return null;
            const y = m[1];
            const mm = m[2].padStart(2, '0');
            const dd = (m[3] || '01').padStart(2, '0');
            return `${y}-${mm}-${dd}`;
        }

        const startDate = toDateStr(startRaw);
        let endDate = null;
        let isCurrent = false;

        if (endRaw) {
            if (/재학|재직|현재/.test(endRaw)) {
                isCurrent = true;
            } else {
                endDate = toDateStr(endRaw);
            }
        }

        return { startDate, endDate, isCurrent };
    }

    async function apiJson(path, options = {}) {
        if (!hasAuth) {
            throw new Error('Auth 유틸이 없습니다. /js/auth.js 로드 여부를 확인하세요.');
        }

        const res = await Auth.apiFetch(path, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

        const body = await res.json();
        if (!body || !body.success) {
            const msg = (body && body.message) ? body.message : 'API 호출 실패';
            throw new Error(msg);
        }
        return body.data;
    }

    // 융합프로젝트 김태형 12주차 : 이력서 메타데이터(파일명, 공개 여부, 요약) 조회해서 상단에 표시 + 메타 캐시 갱신
    async function loadResumeMeta(resumeId) {
        const nameSpan = document.getElementById('file-name-display');
        if (!resumeId || !hasAuth || !nameSpan) return;

        try {
            const data = await apiJson(`/api/resumes/${resumeId}`);
            if (data) {
                if (typeof data.isPublic === 'boolean') {
                    resumeMeta.isPublic = data.isPublic;
                }
                if (typeof data.summary === 'string') {
                    resumeMeta.summary = data.summary;
                }
                if (data.title) {
                    nameSpan.textContent = data.title;
                }
            }
        } catch (err) {
            console.warn('이력서 메타정보 조회 실패(새 이력서일 수 있음):', err);
        }
    }

    // 학력 저장
    async function saveEducationSection(resumeId) {
        const school = document.getElementById('input-edu-school')?.value.trim() || '';
        const major = document.getElementById('input-edu-major')?.value.trim() || '';
        const degree = document.getElementById('input-edu-degree')?.value.trim() || '';
        const period = document.getElementById('input-edu-period')?.value.trim() || '';

        const page = await apiJson(`/api/resumes/${resumeId}/educations?page=0&size=50`);
        if (page && Array.isArray(page.content)) {
            await Promise.all(
                page.content.map((edu) =>
                    apiJson(`/api/educations/${edu.educationId}`, { method: 'DELETE' })
                )
            );
        }

        if (!school && !major && !degree && !period) {
            return;
        }

        const parsed = parsePeriod(period);

        await apiJson(`/api/resumes/${resumeId}/educations`, {
            method: 'POST',
            body: JSON.stringify({
                schoolName: school || null,
                major: major || null,
                degree: degree || null,
                startDate: parsed.startDate,
                endDate: parsed.endDate,
                current: parsed.isCurrent
            })
        });
    }

    // 경력 저장(동적 여러 개)
    async function saveExperienceSections(resumeId) {
        const existing = await apiJson(`/api/resumes/${resumeId}/experiences`);
        if (Array.isArray(existing)) {
            await Promise.all(
                existing.map((exp) =>
                    apiJson(`/api/experiences/${exp.experienceId}`, { method: 'DELETE' })
                )
            );
        }

        const groups = document.querySelectorAll('.experience-group');
        const tasks = [];

        groups.forEach((group) => {
            const idx = group.dataset.expIndex; // 1,2,...

            const company = document.getElementById(`input-exp${idx}-company`)?.value.trim() || '';
            const position = document.getElementById(`input-exp${idx}-position`)?.value.trim() || '';
            const period = document.getElementById(`input-exp${idx}-period`)?.value.trim() || '';
            const desc = document.getElementById(`input-exp${idx}-desc`)?.value.trim() || '';

            if (!company && !position && !period && !desc) return;

            const parsed = parsePeriod(period);

            tasks.push(
                apiJson(`/api/resumes/${resumeId}/experiences`, {
                    method: 'POST',
                    body: JSON.stringify({
                        companyName: company || null,
                        positionTitle: position || null,
                        startDate: parsed.startDate,
                        endDate: parsed.endDate,
                        isCurrent: parsed.isCurrent,
                        description: desc || null
                    })
                })
            );
        });

        await Promise.all(tasks);
    }

    // 프로젝트 저장(동적 여러 개)
    async function saveProjectSections(resumeId) {
        const existing = await apiJson(`/api/resumes/${resumeId}/projects`);
        if (Array.isArray(existing)) {
            await Promise.all(
                existing.map((proj) =>
                    apiJson(`/api/projects/${proj.projectId}`, { method: 'DELETE' })
                )
            );
        }

        const groups = document.querySelectorAll('.project-group');
        const tasks = [];

        groups.forEach((group) => {
            const idx = group.dataset.projIndex;

            const name = document.getElementById(`input-proj${idx}-name`)?.value.trim() || '';
            const role = document.getElementById(`input-proj${idx}-role`)?.value.trim() || '';
            const period = document.getElementById(`input-proj${idx}-period`)?.value.trim() || '';
            const tech = document.getElementById(`input-proj${idx}-tech`)?.value.trim() || '';
            const desc = document.getElementById(`input-proj${idx}-desc`)?.value.trim() || '';

            if (!name && !role && !period && !tech && !desc) return;

            const parsed = parsePeriod(period);

            tasks.push(
                apiJson(`/api/resumes/${resumeId}/projects`, {
                    method: 'POST',
                    body: JSON.stringify({
                        name: name || null,
                        role: role || null,
                        startDate: parsed.startDate,
                        endDate: parsed.endDate,
                        isCurrent: parsed.isCurrent,
                        summary: desc || null,
                        techStack: tech || null,
                        url: null
                    })
                })
            );
        });

        await Promise.all(tasks);
    }

    // 스킬 저장
    async function saveSkillSections(resumeId) {
        const inputEl = document.getElementById('input-skill-list');
        const raw = inputEl ? inputEl.value : '';

        const existing = await apiJson(`/api/resumes/${resumeId}/skills`);
        if (Array.isArray(existing)) {
            await Promise.all(
                existing.map((rs) =>
                    apiJson(`/api/resumes/${resumeId}/skills/${rs.skillId}`, {
                        method: 'DELETE'
                    })
                )
            );
        }

        const names = raw
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        for (const name of names) {
            const searchRes = await apiJson(`/api/skills?q=${encodeURIComponent(name)}&limit=50`);
            let skillId = null;

            if (Array.isArray(searchRes) && searchRes.length > 0) {
                const found = searchRes.find(
                    (s) => s.name && s.name.toLowerCase() === name.toLowerCase()
                );
                if (found) {
                    skillId = found.skillId;
                }
            }

            if (!skillId) {
                const newId = await apiJson('/api/skills', {
                    method: 'POST',
                    body: JSON.stringify({ name })
                });
                skillId = newId;
            }

            await apiJson(`/api/resumes/${resumeId}/skills/${skillId}`, {
                method: 'PUT',
                body: JSON.stringify({ proficiency: 0 })
            });
        }
    }

    async function saveAllSections(resumeId) {
        await saveEducationSection(resumeId);
        await saveExperienceSections(resumeId);
        await saveProjectSections(resumeId);
        await saveSkillSections(resumeId);
    }

    /* ---------- 공통: 입력값 ↔ 미리보기 바인딩 ---------- */

    function bindField(inputId, previewId) {
        const inputEl = document.getElementById(inputId);
        const previewEl = document.getElementById(previewId);
        if (!inputEl || !previewEl) return;

        const handler = (e) => {
            previewEl.textContent = e.target.value || '';
        };

        inputEl.addEventListener('input', handler);

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
    updateEducation();

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

    setupProjectRoleTechBinding(1);

    /* ---------- 사진 업로드 미리보기 ---------- */

    const photoInput = document.getElementById('input-photo');
    const photoBox = document.getElementById('preview-photo-box');

    if (photoInput && photoBox) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
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

    /* ---------- 로그인 정보 자동 채우기 (실제 유저 정보) ---------- */

    // 융합프로젝트 김태형 12주차 : /api/users/me 응답으로 이름/이메일/전화번호를 기본 정보 입력 칸에 채우기
    const fillBtn = document.getElementById('fill-from-user-btn');
    if (fillBtn && window.Auth && typeof window.Auth.fetchMe === 'function') {
        fillBtn.addEventListener('click', () => {
            Auth.fetchMe()
                .then((user) => {
                    if (!user) return;

                    const nameEl = document.getElementById('input-name');
                    const emailEl = document.getElementById('input-email');
                    const phoneEl = document.getElementById('input-phone');

                    if (nameEl && user.name) {
                        nameEl.value = user.name;
                        nameEl.dispatchEvent(new Event('input'));
                    }
                    if (emailEl && user.email) {
                        emailEl.value = user.email;
                        emailEl.dispatchEvent(new Event('input'));
                    }
                    if (phoneEl && user.phone) {
                        phoneEl.value = user.phone;
                        phoneEl.dispatchEvent(new Event('input'));
                    }
                })
                .catch((err) => {
                    console.error('로그인 정보 자동 채우기 실패:', err);
                    alert('로그인 정보를 가져오지 못했습니다.');
                });
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

            bindField(`input-proj${newIndex}-name`, `preview-proj${newIndex}-name`);
            bindField(`input-proj${newIndex}-period`, `preview-proj${newIndex}-period`);
            bindField(`input-proj${newIndex}-desc`, `preview-proj${newIndex}-desc`);
            setupProjectRoleTechBinding(newIndex);

            projCount = newIndex;
        });
    }

    /* ---------- 템플릿 캐러셀 (<, >, 점 6개) ---------- */

    const TEMPLATE_COUNT = 6;
    let currentTemplateIndex = 0;

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

    applyTemplate(0);

    /* ---------- 이력서 목록(내 초안) 페이지로 이동 ---------- */

    const backToListBtn = document.getElementById('back-to-list-btn');
    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            window.location.href = '/resume/make';
        });
    }

    /* ---------- 파일 이름 변경 버튼 ---------- */

    // 융합프로젝트 김태형 12주차 : 상단 "파일 이름 변경" 버튼으로 제목 PATCH (공개 여부/요약도 함께 전송)
    const renameBtn = document.getElementById('rename-file-btn');
    if (renameBtn && resumeId && hasAuth) {
        renameBtn.addEventListener('click', async () => {
            const nameSpan = document.getElementById('file-name-display');
            const current = (nameSpan?.textContent || '새 이력서').trim();

            const next = window.prompt('새 파일 이름을 입력하세요.', current);
            if (next === null) return; // 취소
            const trimmed = next.trim();
            if (!trimmed) {
                alert('파일 이름을 비울 수 없습니다.');
                return;
            }

            try {
                await apiJson(`/api/resumes/${resumeId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        title: trimmed,
                        isPublic: resumeMeta.isPublic ?? false,
                        summary: resumeMeta.summary ?? ''
                    })
                });
                if (nameSpan) {
                    nameSpan.textContent = trimmed;
                }
                alert('파일 이름이 변경되었습니다.');
            } catch (err) {
                console.error('파일 이름 변경 실패:', err);
                alert('파일 이름 변경 중 오류가 발생했습니다.\n' + err.message);
            }
        });
    }

    /* ---------- 상단 "저장하기" 버튼 ---------- */

    // 융합프로젝트 김태형 12주차 : 섹션만 저장(페이지는 그대로 유지)
    const saveFileBtn = document.getElementById('save-file-btn');
    if (saveFileBtn) {
        saveFileBtn.addEventListener('click', async () => {
            if (!resumeId) {
                alert('이력서 ID가 없습니다. /resume/edit?resumeId=... 형태로 접근해야 합니다.');
                return;
            }
            if (!hasAuth) {
                alert('Auth 유틸을 찾을 수 없습니다.');
                return;
            }

            const originalText = saveFileBtn.textContent;
            saveFileBtn.disabled = true;
            saveFileBtn.textContent = '저장 중...';

            try {
                await saveAllSections(resumeId);
                alert('이력서 내용이 저장되었습니다.');
            } catch (err) {
                console.error(err);
                alert('저장 중 오류가 발생했습니다.\n' + err.message);
            } finally {
                saveFileBtn.disabled = false;
                saveFileBtn.textContent = originalText;
            }
        });
    }

    /* ---------- 우측 하단 "이력서 생성하기" 버튼 ---------- */

    // 융합프로젝트 김태형 12주차 : 파일 이름 확인 → 제목 PATCH(공개 여부/요약 포함) → 섹션 저장 후 /resume/make 로 이동
    const createResumeBtn = document.querySelector('.create-btn');
    if (createResumeBtn) {
        createResumeBtn.addEventListener('click', async () => {
            if (!resumeId) {
                alert('이력서 ID가 없습니다.');
                return;
            }
            if (!hasAuth) {
                alert('Auth 유틸을 찾을 수 없습니다.');
                return;
            }

            const nameSpan = document.getElementById('file-name-display');
            const current = (nameSpan?.textContent || '새 이력서').trim();
            const answer = window.prompt('저장할 이력서 이름을 입력하세요.', current);
            if (answer === null) return;
            const title = answer.trim();
            if (!title) {
                alert('파일 이름은 비어 있을 수 없습니다.');
                return;
            }

            const originalText = createResumeBtn.textContent;
            createResumeBtn.disabled = true;
            createResumeBtn.textContent = '저장 중...';

            try {
                // 제목 및 메타 업데이트
                await apiJson(`/api/resumes/${resumeId}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        title,
                        isPublic: resumeMeta.isPublic ?? false,
                        summary: resumeMeta.summary ?? ''
                    })
                });

                if (nameSpan) {
                    nameSpan.textContent = title;
                }

                // 섹션 저장
                await saveAllSections(resumeId);

                // 내 초안 페이지로 이동
                window.location.href = '/resume/make';
            } catch (err) {
                console.error('이력서 생성(최종 저장) 중 오류:', err);
                alert('이력서 저장 중 오류가 발생했습니다.\n' + err.message);
            } finally {
                createResumeBtn.disabled = false;
                createResumeBtn.textContent = originalText;
            }
        });
    }

    /* ---------- 로그인한 사용자 정보 우측 상단 표시 ---------- */

    function loadCurrentUserInfo() {
        const nameEl = document.getElementById('current-user-name');
        const emailEl = document.getElementById('current-user-email');
        if (!nameEl || !emailEl) return;

        if (window.Auth && typeof window.Auth.fetchMe === 'function') {
            Auth.fetchMe()
                .then((user) => {
                    if (!user) return;
                    if (user.name) {
                        nameEl.textContent = user.name;
                    }
                    if (user.email) {
                        emailEl.textContent = user.email;
                    }
                })
                .catch(() => {
                    // 실패시 기본 더미 텍스트 유지
                });
        }
    }

    loadCurrentUserInfo();

    // 페이지 들어올 때 이력서 제목(파일명)과 메타도 한 번 조회
    if (resumeId) {
        loadResumeMeta(resumeId);
    }
});
