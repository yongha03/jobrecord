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
});
