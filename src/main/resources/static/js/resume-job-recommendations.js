// 2233076 13주차 추가: 이력서 기반 추천 공고 JavaScript

// 샘플 데이터 (실제로는 API에서 가져와야 함)
const sampleResumes = [
    {
        id: 1,
        title: "JobRecord-백엔드 개발자 이력서 (최신)",
        skills: ["Java", "Spring Boot", "JPA", "MySQL", "Redis", "Git", "Docker"]
    },
    {
        id: 2,
        title: "학교 프로젝트 중심 이력서",
        skills: ["Java", "Spring", "React", "MySQL", "Git"]
    },
    {
        id: 3,
        title: "신입 공채용 이력서",
        skills: ["Java", "Spring Boot", "MySQL", "Git", "Docker"]
    }
];

const sampleJobs = [
    {
        id: 1,
        title: "백엔드 개발자 (Java/Spring)",
        company: "JobRecord 주식회사",
        location: "서울 강남구",
        matchScore: 92,
        type: "정규직",
        career: "신입~2년",
        salary: "연봉 3,500만 ~ 5,000만",
        extra: "원격 일부 가능",
        description: "Spring Boot 기반 B2C 서비스 백엔드 개발을 담당합니다. REST API 설계·구현, DB 모델링, 성능 최적화 경험이 있는 분을 찾습니다.",
        skills: [
            { name: "Java", match: true },
            { name: "Spring Boot", match: true },
            { name: "JPA", match: true },
            { name: "MySQL", match: true },
            { name: "AWS", match: false }
        ],
        jobType: "백엔드",
        region: "서울",
        isOpen: true
    },
    {
        id: 2,
        title: "주식 분석 서비스 백엔드 개발자",
        company: "스탁매치랩",
        location: "경기 성남시",
        matchScore: 81,
        type: "정규직",
        career: "1~3년",
        salary: "연봉 4,000만 ~ 6,000만",
        extra: "핀테크",
        description: "실시간 시세, 포트폴리오 분석, 리포트 생성 등 투자 서비스 백엔드 전반을 담당합니다. Redis 캐시 및 외부 증권사 API 연동 경험이 있으면 우대합니다.",
        skills: [
            { name: "Java", match: true },
            { name: "Spring Boot", match: true },
            { name: "Redis", match: true },
            { name: "Kafka", match: false },
            { name: "Kotlin", match: null }
        ],
        jobType: "백엔드",
        region: "경기",
        isOpen: true
    },
    {
        id: 3,
        title: "풀스택 웹 개발자",
        company: "커리어노트",
        location: "원격",
        matchScore: 68,
        type: "정규직",
        career: "신입~3년",
        salary: "연봉 3,200만 ~ 4,500만",
        extra: "전면 원격",
        description: "이력서 빌더 및 채용 공고 추천 서비스를 함께 만드는 팀입니다. 백엔드(Java/Spring) 기반에 React 경험이 있으면 더 좋습니다.",
        skills: [
            { name: "Java", match: true },
            { name: "Spring", match: true },
            { name: "React", match: false },
            { name: "TypeScript", match: false },
            { name: "PostgreSQL", match: null }
        ],
        jobType: "풀스택",
        region: "원격",
        isOpen: true
    }
];

// 전역 상태
let selectedResume = null;
let currentJobs = [...sampleJobs];
let filters = {
    region: "",
    jobType: "",
    career: "",
    keyword: "",
    matchOver70: false,
    onlyOpen: true
};

// 2233076 13주차 추가: 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadResumes();
    loadJobs();
    attachEventListeners();
});

// 2233076 13주차 추가: 이력서 목록 로드
function loadResumes() {
    const resumeSelect = document.getElementById('resume-select');
    
    sampleResumes.forEach(resume => {
        const option = document.createElement('option');
        option.value = resume.id;
        option.textContent = resume.title;
        resumeSelect.appendChild(option);
    });
    
    // 첫 번째 이력서 자동 선택
    if (sampleResumes.length > 0) {
        resumeSelect.value = sampleResumes[0].id;
        onResumeChange();
    }
}

// 2233076 13주차 추가: 이력서 변경 시 스킬 칩 업데이트
function onResumeChange() {
    const resumeSelect = document.getElementById('resume-select');
    const resumeId = parseInt(resumeSelect.value);
    
    selectedResume = sampleResumes.find(r => r.id === resumeId);
    
    if (selectedResume) {
        updateSkillChips(selectedResume.skills);
        loadJobs();
    }
}

// 2233076 13주차 추가: 스킬 칩 업데이트
function updateSkillChips(skills) {
    const container = document.getElementById('resume-skill-chips');
    container.innerHTML = '';
    
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

// 2233076 13주차 추가: 공고 목록 로드 및 필터링
function loadJobs() {
    let filteredJobs = [...sampleJobs];
    
    // 필터 적용
    if (filters.region && filters.region !== "전체") {
        filteredJobs = filteredJobs.filter(job => job.region === filters.region);
    }
    
    if (filters.jobType && filters.jobType !== "전체") {
        filteredJobs = filteredJobs.filter(job => job.jobType === filters.jobType);
    }
    
    if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filteredJobs = filteredJobs.filter(job => 
            job.title.toLowerCase().includes(keyword) || 
            job.company.toLowerCase().includes(keyword)
        );
    }
    
    if (filters.matchOver70) {
        filteredJobs = filteredJobs.filter(job => job.matchScore >= 70);
    }
    
    if (filters.onlyOpen) {
        filteredJobs = filteredJobs.filter(job => job.isOpen);
    }
    
    // 정렬
    const sortType = document.getElementById('sort-select').value;
    if (sortType === 'match') {
        filteredJobs.sort((a, b) => b.matchScore - a.matchScore);
    }
    
    currentJobs = filteredJobs;
    renderJobs(filteredJobs);
    updateSummary(filteredJobs);
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
        skillsHtml += `<span class="${chipClass}">${skill.name}</span>`;
    });
    
    article.innerHTML = `
        <div class="job-main">
            <div class="job-header">
                <div>
                    <div class="job-title">${job.title}</div>
                    <div class="job-company">${job.company} · ${job.location}</div>
                </div>
                <div class="match-badge ${matchClass}">매칭도 ${job.matchScore}%</div>
            </div>
            <div class="job-meta">
                <span class="meta-tag">${job.type}</span>
                <span class="meta-tag">${job.career}</span>
                <span class="meta-tag">${job.salary}</span>
                <span class="meta-tag">${job.extra}</span>
            </div>
            <p class="job-desc">${job.description}</p>
            <div class="job-skill-row">${skillsHtml}</div>
        </div>
        <div class="job-actions">
            <button type="button" class="btn btn-primary" onclick="applyJob(${job.id})">지원서 작성</button>
            <button type="button" class="btn btn-outline" onclick="viewJobDetail(${job.id})">공고 자세히 보기</button>
        </div>
    `;
    
    return article;
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
    // 이력서 선택 변경
    document.getElementById('resume-select').addEventListener('change', onResumeChange);
    
    // 필터 변경
    document.getElementById('region-select').addEventListener('change', function() {
        filters.region = this.value;
        loadJobs();
    });
    
    document.getElementById('job-type').addEventListener('change', function() {
        filters.jobType = this.value;
        loadJobs();
    });
    
    document.getElementById('career-select').addEventListener('change', function() {
        filters.career = this.value;
        loadJobs();
    });
    
    document.getElementById('company-keyword').addEventListener('input', function() {
        filters.keyword = this.value;
        loadJobs();
    });
    
    document.getElementById('match-over-70').addEventListener('change', function() {
        filters.matchOver70 = this.checked;
        loadJobs();
    });
    
    document.getElementById('only-open').addEventListener('change', function() {
        filters.onlyOpen = this.checked;
        loadJobs();
    });
    
    // 정렬 변경
    document.getElementById('sort-select').addEventListener('change', loadJobs);
}

// 2233076 13주차 추가: 지원서 작성 (추후 구현)
function applyJob(jobId) {
    alert(`공고 ID ${jobId}에 지원서를 작성합니다. (추후 구현)`);
}

// 2233076 13주차 추가: 공고 상세 보기 (추후 구현)
function viewJobDetail(jobId) {
    alert(`공고 ID ${jobId}의 상세 정보를 표시합니다. (추후 구현)`);
}
