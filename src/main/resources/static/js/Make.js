document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================
    // 1. 내 초안(...) 메뉴 로직
    // ==========================================
    const draftOptionsBtn = document.getElementById('draft-options-btn');
    const draftDropdown = document.getElementById('draft-dropdown');

    if (draftOptionsBtn && draftDropdown) {
        // 토글 기능
        draftOptionsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // 프로필 메뉴가 열려있다면 닫아줌 (서로 겹치지 않게)
            if(profileDropdown) profileDropdown.classList.remove('active');
            
            draftDropdown.classList.toggle('active');
        });
    }

    // ==========================================
    // 2. 프로필(우측 상단) 메뉴 로직 (NEW!)
    // ==========================================
    const profileBtn = document.getElementById('user-profile-btn');
    const profileDropdown = document.getElementById('user-profile-dropdown');

    if (profileBtn && profileDropdown) {
        // 토글 기능
        profileBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            // 초안 메뉴가 열려있다면 닫아줌
            if(draftDropdown) draftDropdown.classList.remove('active');

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

});