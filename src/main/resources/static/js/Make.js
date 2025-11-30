document.addEventListener('DOMContentLoaded', function() {
    // ==========================================
    // 0. 공통: API Base / Auth 객체 체크
    // ==========================================
    const hasAuth = (window.Auth && typeof window.Auth.fetchMe === 'function');

    // ==========================================
    // 1. 내 초안(...) 메뉴 로직
    // ==========================================
    const draftOptionsBtn = document.getElementById('draft-options-btn');
    const draftDropdown = document.getElementById('draft-dropdown');

    // 프로필 드롭다운 요소는 아래에서 선언하지만,
    // 이벤트 핸들러 안에서만 실제로 접근되므로 TDZ 문제 없음
    let profileBtn = null;
    let profileDropdown = null;

    if (draftOptionsBtn && draftDropdown) {
        // 토글 기능
        draftOptionsBtn.addEventListener('click', function(e) {
            e.stopPropagation();

            // 프로필 메뉴가 열려있다면 닫아줌 (서로 겹치지 않게)
            if (profileDropdown) {
                profileDropdown.classList.remove('active');
            }

            draftDropdown.classList.toggle('active');
        });
    }

    // ==========================================
    // 2. 프로필(우측 상단) 메뉴 로직
    // ==========================================
    profileBtn = document.getElementById('user-profile-btn');
    profileDropdown = document.getElementById('user-profile-dropdown');

    if (profileBtn && profileDropdown) {
        // 토글 기능
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();

            // 초안 메뉴가 열려있다면 닫아줌
            if (draftDropdown) {
                draftDropdown.classList.remove('active');
            }

            profileDropdown.classList.toggle('active');
        });
    }

    // ==========================================
    // 3. 공통: 화면의 빈 곳 클릭 시 모든 메뉴 닫기
    // ==========================================
    window.addEventListener('click', function(e) {

        // 초안 메뉴 닫기
        if (draftDropdown && draftOptionsBtn) {
            if (!draftDropdown.contains(e.target) && !draftOptionsBtn.contains(e.target)) {
                draftDropdown.classList.remove('active');
            }
        }

        // 프로필 메뉴 닫기
        if (profileDropdown && profileBtn) {
            if (!profileDropdown.contains(e.target) && !profileBtn.contains(e.target)) {
                profileDropdown.classList.remove('active');
            }
        }
    });

    // ==========================================
    // 4. 로그인한 사용자 정보(/api/users/me)로
    //    우측 상단 이름/이메일 채우기
    // ==========================================
    const nameEl = document.querySelector('.user-name-small');
    const emailEl = document.querySelector('.user-email-small');

    if (hasAuth && nameEl && emailEl) {
        window.Auth.fetchMe()
            .then(function(user) {
                if (!user) {
                    console.warn('사용자 정보를 가져오지 못했습니다.');
                    return;
                }

                // 서버에서 내려오는 필드: name, email (UserDto.Response 기반)
                nameEl.textContent = user.name || '';
                emailEl.textContent = user.email || '';
            })
            .catch(function(err) {
                console.error('현재 로그인한 사용자 정보 조회 실패:', err);
            });
    } else {
        console.warn('Auth.fetchMe 또는 .user-name-small / .user-email-small 요소를 찾을 수 없습니다.');
    }

    // ==========================================
    // 5. 로그아웃 버튼(.logout-option) 처리
    // ==========================================
    const logoutLink = document.querySelector('.logout-option');

    if (hasAuth && logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();

            window.Auth.logout()
                .catch(function(err) {
                    console.warn('로그아웃 요청 실패(그래도 이동):', err);
                })
                .finally(function() {
                    // 로그아웃 후 이동할 위치: 필요에 따라 /home 또는 /auth/login 등으로 조정
                    window.location.href = '/auth/login';
                });
        });
    } else {
        console.warn('Auth.logout 또는 .logout-option 요소를 찾을 수 없습니다.');
    }

    // ==========================================
    // 6. 새 이력서 생성 + 편집 화면 이동
    // ==========================================
    //2233073 김용하 12주차 : /api/resumes POST로 새 이력서 생성 후 /resume/edit?resumeId=... 로 이동
    const newResumeBtn = document.getElementById('new-resume-btn');

    if (newResumeBtn && window.Auth && typeof window.Auth.apiFetch === 'function') {
        newResumeBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // 버튼 중복 클릭 방지용 간단 처리
            if (newResumeBtn.dataset.loading === 'true') {
                return;
            }
            newResumeBtn.dataset.loading = 'true';

            const originalHtml = newResumeBtn.innerHTML;
            newResumeBtn.innerHTML = '<span class="plus-icon">+</span> 생성 중...';

            // CreateRequest 형식에 맞게 title / summary / isPublic 전송
            window.Auth.apiFetch('/api/resumes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: '새 이력서',
                    summary: '',
                    isPublic: false
                })
            })
            .then(function(res) { return res.json(); })
            .then(function(body) {
                if (!body || !body.success || body.data == null) {
                    throw new Error(body && body.message ? body.message : '이력서 생성 실패');
                }

                const resumeId = body.data; // Long ID
                // 생성된 이력서의 편집 화면으로 이동
                window.location.href = '/resume/edit?resumeId=' + encodeURIComponent(resumeId);
            })
            .catch(function(err) {
                console.error('새 이력서 생성 중 오류:', err);
                alert('이력서 생성에 실패했습니다.\n' + (err.message || '알 수 없는 오류'));
            })
            .finally(function() {
                newResumeBtn.dataset.loading = 'false';
                newResumeBtn.innerHTML = originalHtml;
            });
        });
    } else {
        console.warn('new-resume-btn 또는 Auth.apiFetch를 찾을 수 없습니다.');
    }

    // ==========================================
    // 7. 내 이력서 목록 동적 렌더링
    // ==========================================
    //2233073 김용하 12주차 : /api/resumes 목록을 조회해서 카드 형태로 그리기
    const draftsContainer = document.querySelector('.drafts-container');

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async function loadMyResumes() {
        if (!draftsContainer) return;
        if (!window.Auth || typeof window.Auth.apiFetch !== 'function') {
            console.warn('Auth.apiFetch가 없어 이력서 목록을 불러오지 않습니다.');
            return;
        }

        // 기존에 하드코딩된 "이력서1" 카드 포함 전부 제거
        draftsContainer.innerHTML = '';

        try {
            // createdAt 내림차순으로 정렬 (가장 최근 이력서가 앞에 오도록)
            const res = await window.Auth.apiFetch('/api/resumes?page=0&size=50&sort=createdAt,desc');
            const body = await res.json();

            if (!body || !body.success || !body.data) {
                throw new Error(body && body.message ? body.message : '이력서 목록 조회 실패');
            }

            const page = body.data;
            const items = Array.isArray(page.content) ? page.content : [];

            if (items.length === 0) {
                draftsContainer.innerHTML =
                    '<p class="empty-drafts-text">아직 저장된 이력서가 없습니다. ' +
                    '상단의 "새 이력서" 버튼을 눌러 첫 이력서를 만들어 보세요.</p>';
                return;
            }

            items.forEach(function(resume) {
                const card = document.createElement('div');
                card.className = 'draft-card';
                card.dataset.resumeId = resume.resumeId;

                const title = resume.title || '제목 없음';

                card.innerHTML = `
                    <div class="draft-card-preview"></div> 
                    <div class="draft-card-info">
                        <span class="draft-name">${escapeHtml(title)}</span>
                    </div>
                `;

                // 카드 전체 클릭 시 해당 이력서 편집 페이지로 이동
                card.addEventListener('click', function(e) {
                    e.preventDefault();
                    const id = card.dataset.resumeId;
                    if (!id) return;
                    window.location.href = '/resume/edit?resumeId=' + encodeURIComponent(id);
                });

                draftsContainer.appendChild(card);
            });
        } catch (err) {
            console.error('이력서 목록 조회 실패:', err);
            draftsContainer.innerHTML =
                '<p class="empty-drafts-text">이력서 목록을 불러오지 못했습니다.</p>';
        }
    }

    // 페이지 로드 시 이력서 목록 불러오기
    if (draftsContainer) {
        loadMyResumes();
    }
});
