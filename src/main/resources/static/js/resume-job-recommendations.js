// 2233076 13주차 추가: 이력서 기반 추천 공고 JavaScript

// 전역 상태
let selectedResume = null;
let currentJobs = [];
let filters = {
    region: "",
    jobType: "",
    career: "",
    keyword: "",
    matchOver70: false,
    onlyOpen: true
};

// auth.js의 apiFetch 사용
const apiFetch = window.Auth?.apiFetch;

// 2233076 13주차 추가: 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    if (!apiFetch) {
        console.error('Auth.apiFetch를 찾을 수 없습니다.');
        alert('로그인이 필요합니다.');
        window.location.href = '/auth/login';
        return;
    }
    
    loadResumes();
    attachEventListeners();
});

// 2233076 13주차 추가: 이력서 목록 로드 (실제 API)
async function loadResumes() {
    try {
        const response = await apiFetch('/api/resumes', { method: 'GET' });
        const result = await response.json();
        
        // API 응답 형식 확인
        let resumes = result;
        if (result.success && result.data) {
            resumes = result.data;
        }
        
        // PageResponse 형식 처리
        if (resumes.content && Array.isArray(resumes.content)) {
            resumes = resumes.content;
        } else if (resumes.items && Array.isArray(resumes.items)) {
            resumes = resumes.items;
        } else if (!Array.isArray(resumes)) {
            console.error('이력서 배열이 아닙니다:', resumes);
            alert('등록된 이력서가 없습니다. 먼저 이력서를 작성해주세요.');
            window.location.href = '/Make';
            return;
        }
        
        const resumeSelect = document.getElementById('resume-select');
        resumeSelect.innerHTML = '<option value="">이력서를 선택하세요</option>';
        
        if (resumes.length === 0) {
            alert('등록된 이력서가 없습니다. 먼저 이력서를 작성해주세요.');
            window.location.href = '/Make';
            return;
        }
        
        resumes.forEach(resume => {
            const option = document.createElement('option');
            option.value = resume.resumeId;
            option.textContent = resume.title;
            resumeSelect.appendChild(option);
        });
        
        // 첫 번째 이력서 자동 선택 (자동 검색 제거)
        if (resumes.length > 0) {
            resumeSelect.value = resumes[0].resumeId;
            await onResumeChange();
        }
    } catch (error) {
        console.error('이력서 목록 로드 실패:', error);
        alert('이력서 목록을 불러오는데 실패했습니다.');
    }
}

// 2233076 13주차 개선: 이력서 종합 정보 추출 (자동 검색 제거)
async function onResumeChange() {
    const resumeSelect = document.getElementById('resume-select');
    const resumeId = resumeSelect.value;
    
    if (!resumeId) {
        selectedResume = null;
        updateSkillChips([]);
        // 검색 버튼 비활성화
        document.getElementById('search-button').disabled = true;
        // 공고 초기화
        currentJobs = [];
        renderJobs([]);
        updateSummary([]);
        return;
    }
    
    try {
        // 1. 이력서 기본 정보 조회
        const resumeResponse = await apiFetch(`/api/resumes/${resumeId}`, { method: 'GET' });
        const resumeResult = await resumeResponse.json();
        const resumeData = resumeResult.success ? resumeResult.data : resumeResult;
        
        // 2. 이력서 스킬 조회
        const skillsResponse = await apiFetch(`/api/resumes/${resumeId}/skills`, { method: 'GET' });
        const skillsResult = await skillsResponse.json();
        let skills = skillsResult.success ? skillsResult.data : skillsResult;
        if (!Array.isArray(skills)) {
            skills = skills.content || skills.items || [];
        }
        const skillNames = skills.map(s => s.skillName || s.name || s).filter(Boolean);
        
        // 3. 학력 정보 조회
        const educationsResponse = await apiFetch(`/api/resumes/${resumeId}/educations`, { method: 'GET' });
        const educationsResult = await educationsResponse.json();
        let educations = educationsResult.success ? educationsResult.data : educationsResult;
        if (!Array.isArray(educations)) {
            educations = educations.content || educations.items || [];
        }
        
        // 4. 경력 정보 조회
        const experiencesResponse = await apiFetch(`/api/resumes/${resumeId}/experiences`, { method: 'GET' });
        const experiencesResult = await experiencesResponse.json();
        let experiences = experiencesResult.success ? experiencesResult.data : experiencesResult;
        if (!Array.isArray(experiences)) {
            experiences = experiences.content || experiences.items || [];
        }
        
        // 종합 이력서 정보 저장
        selectedResume = {
            id: resumeId,
            name: resumeData.name || '미입력',
            skills: skillNames,
            educations: educations.map(edu => ({
                schoolName: edu.schoolName,
                major: edu.major,
                degree: edu.degree,
                startDate: edu.startDate,
                endDate: edu.endDate
            })),
            experiences: experiences.map(exp => ({
                companyName: exp.companyName,
                positionTitle: exp.positionTitle,
                startDate: exp.startDate,
                endDate: exp.endDate,
                isCurrent: exp.isCurrent,
                description: exp.description
            }))
        };
        
        updateSkillChips(selectedResume.skills);
        
        // 검색 버튼 활성화
        document.getElementById('search-button').disabled = false;
        
    } catch (error) {
        console.error('이력서 정보 로드 실패:', error);
        // 최소 정보로 검색 가능
        selectedResume = { 
            id: resumeId, 
            name: '미입력',
            skills: [],
            educations: [],
            experiences: []
        };
        updateSkillChips([]);
        document.getElementById('search-button').disabled = false;
    }
}

// 2233076 13주차 추가: 스킬 칩 업데이트
function updateSkillChips(skills) {
    const container = document.getElementById('resume-skill-chips');
    container.innerHTML = '';
    
    if (skills.length === 0) {
        container.innerHTML = '<span style="color: #9ca3af;">등록된 스킬이 없습니다</span>';
        return;
    }
    
    skills.forEach((skill, index) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        if (index < 3) {
            chip.classList.add('highlight');
        }
        chip.textContent = skill;
        container.appendChild(chip);
    });
}

// 2233076 13주차 개선: 공고 목록 로드 (실제 API + 배치 Gemini, 종합 이력서 정보 전달)
async function loadJobs() {
    // 로딩 표시
    showLoading();
    
    try {
        // 잡코리아 API 호출 (/jobs/recommend)
        const response = await apiFetch('/jobs/recommend?limit=20', { method: 'GET' });
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || '채용공고 조회 실패');
        }
        
        // 종합 이력서 정보
        const resumeInfo = {
            name: selectedResume?.name || '미입력',
            skills: selectedResume?.skills || [],
            educations: selectedResume?.educations || [],
            experiences: selectedResume?.experiences || []
        };
        
        // Gemini API 배치 매칭 (한 번에 20개, 종합 정보 포함)
        let jobs = [];
        if (resumeInfo.skills.length > 0 || resumeInfo.experiences.length > 0) {
            try {
                const matchResponse = await apiFetch('/jobs/match/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resumeInfo: resumeInfo,
                        jobs: result.data
                    })
                });
                
                const matchResult = await matchResponse.json();
                
                if (matchResult.success && matchResult.data) {
                    // Gemini 결과와 공고 매핑
                    jobs = result.data.map((job, index) => {
                        const match = matchResult.data[index];
                        return convertJobDtoToCard(job, match);
                    });
                } else {
                    throw new Error('배치 매칭 실패');
                }
            } catch (error) {
                console.warn('AI 배치 매칭 실패, 기본 매칭 사용:', error);
                // 기본 매칭 사용
                jobs = result.data.map(job => convertJobDtoToCardSimple(job));
            }
        } else {
            jobs = result.data.map(job => convertJobDtoToCardSimple(job));
        }
        
        // 필터 적용
        let filteredJobs = applyFilters(jobs);
        
        // 정렬
        const sortType = document.getElementById('sort-select').value;
        if (sortType === 'match') {
            filteredJobs.sort((a, b) => b.matchScore - a.matchScore);
        }
        
        currentJobs = filteredJobs;
        renderJobs(filteredJobs);
        updateSummary(filteredJobs);
        
    } catch (error) {
        console.error('채용공고 로드 실패:', error);
        document.getElementById('job-list').innerHTML = 
            '<p style="text-align: center; color: #ef4444; padding: 40px;">채용공고를 불러오는데 실패했습니다.</p>';
    } finally {
        // 로딩 숨김
        hideLoading();
    }
}

// 2233076 13주차 추가: 로딩 표시
function showLoading() {
    const loadingEl = document.getElementById('ai-loading');
    if (loadingEl) {
        loadingEl.style.display = 'flex';
    }
}

// 2233076 13주차 추가: 로딩 숨김
function hideLoading() {
    const loadingEl = document.getElementById('ai-loading');
    if (loadingEl) {
        loadingEl.style.display = 'none';
    }
}

// 2233076 13주차 추가: JobDto → 카드 형식 변환 (Gemini 결과 사용)
function convertJobDtoToCard(job, matchResult) {
    const resumeSkills = selectedResume?.skills || [];
    const jobTags = job.tags || [];
    
    // Gemini 매칭 결과 사용
    const matchScore = matchResult?.matchScore || 0;
    const skillsWithMatch = jobTags.map(tag => {
        const resumeHas = resumeSkills.some(s => s.toLowerCase() === tag.toLowerCase());
        return { 
            name: tag, 
            matched: resumeHas,
            reason: resumeHas ? "일치" : "불일치"
        };
    });
    
    const experienceMap = {
        'JUNIOR': '신입',
        'MID': '경력 1-3년',
        'SENIOR': '경력 3년 이상'
    };
    
    return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        matchScore: matchScore,
        type: '정규직',
        career: experienceMap[job.experience] || '경력무관',
        salary: job.salaryMin && job.salaryMax 
            ? `연봉 ${job.salaryMin}만 ~ ${job.salaryMax}만` 
            : '회사 내규',
        extra: '',
        description: `${job.company}에서 ${job.title} 포지션을 채용합니다.`,
        skills: skillsWithMatch,
        jobType: jobTags.includes('백엔드') ? '백엔드' : jobTags.includes('프론트엔드') ? '프론트엔드' : '기타',
        region: job.location ? job.location.split(' ')[0] : '전국',
        isOpen: true,
        applyUrl: job.applyUrl,
        sourceUrl: job.sourceUrl
    };
}

// 2233076 13주차 추가: 기본 매칭 (Gemini 없이)
function convertJobDtoToCardSimple(job) {
    const resumeSkills = selectedResume?.skills || [];
    const jobTags = job.tags || [];
    
    const matchedCount = jobTags.filter(tag => 
        resumeSkills.some(s => s.toLowerCase() === tag.toLowerCase())
    ).length;
    const matchScore = jobTags.length > 0 ? Math.round((matchedCount / jobTags.length) * 100) : 0;
    
    const skillsWithMatch = jobTags.map(tag => ({
        name: tag,
        matched: resumeSkills.some(s => s.toLowerCase() === tag.toLowerCase())
    }));
    
    const experienceMap = {
        'JUNIOR': '신입',
        'MID': '경력 1-3년',
        'SENIOR': '경력 3년 이상'
    };
    
    return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        matchScore: matchScore,
        type: '정규직',
        career: experienceMap[job.experience] || '경력무관',
        salary: job.salaryMin && job.salaryMax 
            ? `연봉 ${job.salaryMin}만 ~ ${job.salaryMax}만` 
            : '회사 내규',
        extra: '',
        description: `${job.company}에서 ${job.title} 포지션을 채용합니다.`,
        skills: skillsWithMatch,
        jobType: jobTags.includes('백엔드') ? '백엔드' : jobTags.includes('프론트엔드') ? '프론트엔드' : '기타',
        region: job.location ? job.location.split(' ')[0] : '전국',
        isOpen: true,
        applyUrl: job.applyUrl,
        sourceUrl: job.sourceUrl
    };
}

// 2233076 13주차 추가: 필터 적용
function applyFilters(jobs) {
    let filtered = [...jobs];
    
    if (filters.region && filters.region !== "전체") {
        filtered = filtered.filter(job => job.region.includes(filters.region));
    }
    
    if (filters.jobType && filters.jobType !== "전체") {
        filtered = filtered.filter(job => job.jobType === filters.jobType);
    }
    
    if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filtered = filtered.filter(job => 
            job.title.toLowerCase().includes(keyword) || 
            job.company.toLowerCase().includes(keyword)
        );
    }
    
    if (filters.matchOver70) {
        filtered = filtered.filter(job => job.matchScore >= 70);
    }
    
    if (filters.onlyOpen) {
        filtered = filtered.filter(job => job.isOpen);
    }
    
    return filtered;
}

// 2233076 13주차 추가: 공고 카드 렌더링
function renderJobs(jobs) {
    const container = document.getElementById('job-list');
    container.innerHTML = '';
    
    if (jobs.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px;">조건에 맞는 공고가 없습니다.</p>';
        return;
    }
    
    jobs.forEach(job => {
        const card = createJobCard(job);
        container.appendChild(card);
    });
}

// 2233076 13주차 추가: 공고 카드 생성
function createJobCard(job) {
    const article = document.createElement('article');
    article.className = 'job-card';
    article.dataset.matchScore = job.matchScore;
    
    const matchClass = job.matchScore >= 80 ? 'match-high' : 
                       job.matchScore >= 60 ? 'match-mid' : 'match-low';
    
    let skillsHtml = '<span class="job-skill-label">요구 기술</span>';
    job.skills.forEach(skill => {
        const chipClass = skill.match === true ? 'chip skill-match' :
                         skill.match === false ? 'chip skill-gap' : 'chip';
        skillsHtml += `<span class="${chipClass}">${escapeHtml(skill.name)}</span>`;
    });
    
    article.innerHTML = `
        <div class="job-main">
            <div class="job-header">
                <div>
                    <div class="job-title">${escapeHtml(job.title)}</div>
                    <div class="job-company">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</div>
                </div>
                <div class="match-badge ${matchClass}">매칭도 ${job.matchScore}%</div>
            </div>
            <div class="job-meta">
                <span class="meta-tag">${job.type}</span>
                <span class="meta-tag">${job.career}</span>
                <span class="meta-tag">${job.salary}</span>
                ${job.extra ? `<span class="meta-tag">${job.extra}</span>` : ''}
            </div>
            <p class="job-desc">${escapeHtml(job.description)}</p>
            <div class="job-skill-row">${skillsHtml}</div>
        </div>
        <div class="job-actions">
            <button type="button" class="btn btn-outline" onclick="viewJobDetail('${job.applyUrl || job.sourceUrl}')">공고 자세히 보기</button>
        </div>
        <div class="job-source">
            <a href="https://www.jobkorea.co.kr" target="_blank" rel="noopener">잡코리아 제공</a>
        </div>
    `;
    
    return article;
}

// XSS 방지
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 2233076 13주차 추가: 요약 정보 업데이트
function updateSummary(jobs) {
    const avgMatch = jobs.length > 0 ? 
        Math.round(jobs.reduce((sum, job) => sum + job.matchScore, 0) / jobs.length) : 0;
    
    document.getElementById('summary-count').textContent = `${jobs.length}개의 채용 공고`;
    document.getElementById('summary-match').textContent = `이력서와 평균 매칭도 약 ${avgMatch}%`;
    document.getElementById('total-count').textContent = `총 ${jobs.length}건`;
}

// 2233076 13주차 추가: 이벤트 리스너 연결
function attachEventListeners() {
    // 이력서 선택 변경 (자동 검색 제거)
    document.getElementById('resume-select').addEventListener('change', onResumeChange);
    
    // 검색 버튼 클릭
    document.getElementById('search-button').addEventListener('click', loadJobs);
    
    // 필터 변경 시 자동 재검색 제거
    document.getElementById('region-select').addEventListener('change', function() {
        filters.region = this.value;
    });
    
    document.getElementById('job-type').addEventListener('change', function() {
        filters.jobType = this.value;
    });
    
    document.getElementById('career-select').addEventListener('change', function() {
        filters.career = this.value;
    });
    
    document.getElementById('company-keyword').addEventListener('input', function() {
        filters.keyword = this.value;
    });
    
    document.getElementById('match-over-70').addEventListener('change', function() {
        filters.matchOver70 = this.checked;
    });
    
    document.getElementById('only-open').addEventListener('change', function() {
        filters.onlyOpen = this.checked;
    });
    
    // 정렬 변경 시에만 즉시 반영 (이미 로드된 데이터 재정렬)
    document.getElementById('sort-select').addEventListener('change', function() {
        if (currentJobs.length > 0) {
            let sorted = applyFilters(currentJobs);
            const sortType = this.value;
            if (sortType === 'match') {
                sorted.sort((a, b) => b.matchScore - a.matchScore);
            }
            renderJobs(sorted);
            updateSummary(sorted);
        }
    });
}

// 2233076 13주차 추가: 공고 상세 보기
function viewJobDetail(url) {
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        alert('공고 상세 URL이 없습니다.');
    }
}
