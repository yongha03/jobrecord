# 💼 JobProj 백엔드 (Spring Boot + JDBC)

> 웹 이력서 관리 및 채용 정보 연동 백엔드 서버  
> Spring Boot 3.x + Java 17 + JDBC 기반 REST API

---

## ⚙️ 기술 스택

| 구분 | 기술 |
|------|------|
| 언어 | Java 17 |
| 프레임워크 | Spring Boot 3.3.5 |
| 빌드 도구 | Gradle |
| 데이터베이스 | MySQL 8.x |
| ORM / 데이터 접근 | JDBC Template |
| 인증 / 인가 | Spring Security + JWT |
| 문서화 | Swagger / OpenAPI |
| 배포 환경 | Docker Compose |
| IDE | IntelliJ IDEA |

---

## 🚀 빠른 시작 (Quick Start)

### 1️⃣ MySQL 실행하기

```bash
docker compose up -d
```

`./db/` 폴더 안에 **01_schema.sql** 을 넣어두면 테이블이 자동으로 생성됩니다.  
(선택사항) 샘플 데이터를 추가하려면 **sql/02_sample_data.sql** 을 실행하세요.

---

### 2️⃣ IntelliJ로 프로젝트 열기

이 폴더를 IntelliJ에서 **Gradle 프로젝트**로 임포트합니다.  
**JDK 17** 환경을 사용합니다.

---

### 3️⃣ 메인 클래스 실행

`Application` 클래스를 실행하여 서버를 시작합니다.

---

## 📡 주요 엔드포인트 (Endpoints)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버 상태 확인 |
| POST | `/auth/login` | 로그인 (요청 본문: `{"email","password"}`) |
| GET | `/job-postings/active?limit=10&offset=0` | 활성 채용공고 목록 조회 |
| GET | `/resumes?userId=1` | 특정 사용자의 이력서 목록 조회 |
| POST | `/resumes` | 이력서 등록 |
| PUT | `/resumes/{id}` | 이력서 수정 |
| DELETE | `/resumes/{id}` | 이력서 삭제 |

---

## 👤 데모 계정 (Demo Login)

시드 데이터 삽입 후 아래 계정으로 로그인할 수 있습니다.

- 이메일: `test@example.com`  
- 비밀번호: `test1234`

---

## 📂 프로젝트 구조

```plaintext
jobrecord_backend/
 ├── build.gradle                 # Gradle 빌드 스크립트
 ├── docker-compose.yml           # MySQL + 앱 컨테이너 구성
 ├── db/                          # DB 스키마 및 샘플 데이터
 │    ├── 01_schema.sql
 │    └── 02_sample_data.sql
 ├── src/
 │   ├── main/
 │   │   ├── java/com/jobproj/api/
 │   │   │   ├── Application.java             # Spring Boot 메인 클래스
 │   │   │   ├── common/                     # 공통 유틸, ApiResponse, Page 객체 등
 │   │   │   ├── config/                     # CORS, Swagger, 전역 예외 설정
 │   │   │   ├── security/                   # JWT 토큰 생성/검증, 필터, 시큐리티 설정
 │   │   │   ├── resume/                     # 이력서 CRUD 모듈
 │   │   │   ├── section/                    # 학력/경력/프로젝트/스킬 서브모듈
 │   │   │   └── attachment/                 # 첨부파일 및 프로필 이미지 관리
 │   │   └── resources/
 │   │       ├── application.yml             # 기본 설정
 │   │       └── application-local.yml       # 로컬 개발 설정
 └── README.md
```

---

## 📁 폴더별 역할 요약

| 폴더 | 설명 |
|------|------|
| `common` | 공통 응답 포맷, 페이징 객체, DB 유틸 등 |
| `config` | 예외처리, Swagger 문서화, CORS 보안 설정 |
| `security` | JWT 기반 인증/인가 로직, 토큰 발급 및 검증 |
| `resume` | 이력서 CRUD API 및 비즈니스 로직 |
| `section` | 학력·경력·프로젝트·스킬 하위 모듈 |
| `attachment` | 파일 업로드, 프로필 이미지 관리 |
| `db` | 초기 스키마(`01_schema.sql`), 샘플 데이터(`02_sample_data.sql`) |
