package com.jobproj.api.resume;

import com.jobproj.api.common.ApiResponse;
import com.jobproj.api.common.PageRequest;
import com.jobproj.api.common.PageResponse;
import com.jobproj.api.resume.ResumeDto.CreateRequest;
import com.jobproj.api.resume.ResumeDto.Response;
import com.jobproj.api.resume.ResumeDto.UpdateRequest;
import com.jobproj.api.security.CurrentUser;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import java.net.URI;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 융합프로젝트 김태형 12주차 :
 *  - 이력서 CRUD + PDF 내보내기 API 컨트롤러
 *  - JSON API (/api/resumes/**) 를 담당한다.
 */
@RestController
@RequestMapping(value = "/api/resumes", produces = MediaType.APPLICATION_JSON_VALUE)
@Tag(name = "Resume", description = "이력서 CRUD")
public class ResumeController {

  private final ResumeService service;

  // 융합프로젝트 김태형 12주차 : 이력서 PDF 바이트 생성 전용 서비스
  private final ResumePdfService pdfService;

  private final CurrentUser currentUser;

  public ResumeController(
      ResumeService service, ResumePdfService pdfService, CurrentUser currentUser) {
    this.service = service;
    this.pdfService = pdfService;
    this.currentUser = currentUser;
  }

  @Operation(
      summary = "이력서 생성",
      description = "요청 본문의 값 검증 후, 로그인 사용자(토큰)의 소유로 생성합니다.",
      security = { @SecurityRequirement(name = "cookieAuth") })
  @ApiResponses({
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "201", description = "생성됨"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "400", description = "Validation 오류"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "401", description = "미인증"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "403", description = "소유권 위반(Owner mismatch 정책 위배 시)")
  })
  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<ApiResponse<Long>> create(@Valid @RequestBody CreateRequest req) {
    Long usersId = currentUser.id(); // 로그인 사용자 id
    Long id = service.create(usersId, req); // 소유자 id와 함께 생성
    return ResponseEntity.created(URI.create("/api/resumes/" + id))
        .body(ApiResponse.ok("created", id));
  }

  @Operation(
      summary = "이력서 단건 조회",
      description = "소유권(로그인 사용자) 검사 후 단건을 반환합니다.",
      security = { @SecurityRequirement(name = "cookieAuth") })
  @ApiResponses({
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "200", description = "OK"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "401", description = "미인증"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "403", description = "소유권 위반"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "404", description = "미존재")
  })
  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<Response>> get(@PathVariable Long id) {
    Long usersId = currentUser.id(); // 소유권 강제
    var opt = service.get(id, usersId); // (id, usersId) 시그니처
    return opt
        .map(r -> ResponseEntity.ok(ApiResponse.ok(r)))
        .orElseGet(
            () ->
                ResponseEntity.status(404)
                    .body(ApiResponse.fail("NOT_FOUND", "resume not found")));
  }

  @Operation(
      summary = "이력서 목록 조회",
      description = "로그인 사용자의 이력서를 페이지네이션/정렬/검색으로 조회합니다.",
      security = { @SecurityRequirement(name = "cookieAuth") })
  @ApiResponses({
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "200", description = "OK"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "401", description = "미인증")
  })
  @GetMapping
  public ResponseEntity<ApiResponse<PageResponse<Response>>> list(
      @Parameter(description = "페이지(0-base)") @RequestParam(required = false) Integer page,
      @Parameter(description = "페이지 사이즈(1~100)")
          @RequestParam(required = false)
          Integer size,
      @Parameter(description = "정렬규칙 예) createdAt,desc")
          @RequestParam(required = false)
          String sort,
      @Parameter(description = "검색어") @RequestParam(required = false) String keyword) {

    Long usersId = currentUser.id(); // 토큰에서 소유자 추출
    var pr = new PageRequest(page, size, sort);
    var res = service.list(pr, usersId, keyword);
    return ResponseEntity.ok(ApiResponse.ok(res));
  }

  @Operation(
      summary = "이력서 수정",
      description = "소유권 검사 후 부분 업데이트(PATCH)합니다.",
      security = { @SecurityRequirement(name = "cookieAuth") })
  @ApiResponses({
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "200", description = "수정 완료"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "400", description = "Validation 오류"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "401", description = "미인증"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "403", description = "소유권 위반"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "404", description = "미존재")
  })
  @PatchMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<ApiResponse<Void>> update(
      @PathVariable Long id, @Valid @RequestBody UpdateRequest req) {

    Long usersId = currentUser.id(); // 소유권 강제
    boolean ok = service.update(id, usersId, req);
    return ok
        ? ResponseEntity.ok(ApiResponse.ok(null))
        : ResponseEntity.status(404)
            .body(ApiResponse.fail("NOT_FOUND", "resume not found"));
  }

  @Operation(
      summary = "이력서 삭제",
      description = "소유권 검사 후 삭제합니다.",
      security = { @SecurityRequirement(name = "cookieAuth") })
  @ApiResponses({
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "200", description = "삭제 완료"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "401", description = "미인증"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "403", description = "소유권 위반"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "404", description = "미존재")
  })
  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
    Long usersId = currentUser.id(); // 소유권 강제
    boolean ok = service.delete(id, usersId);
    return ok
        ? ResponseEntity.ok(ApiResponse.ok(null))
        : ResponseEntity.status(404)
            .body(ApiResponse.fail("NOT_FOUND", "resume not found"));
  }

  // ------------------------------------------------------------
  // 융합프로젝트 김태형 12주차 :
  //  이력서 PDF 내보내기 API
  //   - GET /api/resumes/{id}/pdf?template=번호
  //   - 쿼리파라미터로 템플릿 번호(1~6)를 받고,
  //     ResumePdfService 에게 넘겨서 템플릿별 레이아웃으로 PDF 생성.
  // ------------------------------------------------------------
  @Operation(
      summary = "이력서 PDF 다운로드",
      description = "소유권을 검사한 뒤 해당 이력서를 PDF 파일로 다운로드합니다.",
      security = { @SecurityRequirement(name = "cookieAuth") })
  @ApiResponses({
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "200", description = "PDF 다운로드"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "401", description = "미인증"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "403", description = "소유권 위반"),
      @io.swagger.v3.oas.annotations.responses.ApiResponse(
          responseCode = "404", description = "미존재")
  })
  @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> exportPdf(
      @PathVariable Long id,
      @RequestParam(name = "template", required = false) Integer template) {

    Long usersId = currentUser.id();

    // 융합프로젝트 김태형 12주차 : 템플릿 번호 유효성 체크(1~6, 그 외는 1로 처리)
    int templateIndex =
        (template == null || template < 1 || template > 6) ? 1 : template.intValue();

    byte[] pdfBytes = pdfService.generateResumePdf(id, usersId, templateIndex);
    if (pdfBytes == null || pdfBytes.length == 0) {
      // 이력서가 없거나 소유권 위반인 경우
      return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    String filename = "resume-" + id + ".pdf";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_PDF);
    headers.setContentLength(pdfBytes.length);
    headers.setContentDispositionFormData("attachment", filename);

    return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
  }
}

/* ============================================================
 * 융합프로젝트 김태형 12주차 :
 * HTML 이력서 화면용 MVC 컨트롤러.
 *  - /resume/make → 내 초안(이력서 목록) 페이지(templates/resume/Make.html)
 *  - /resume/edit → 이력서 편집 페이지(templates/resume/resume-edit.html)
 *
 * API(JSON)용 ResumeController와 분리해서,
 * 뷰 이름만 반환하고 실제 데이터(로그인 사용자 정보 등)는
 * 프론트 JS(auth.js)가 /api/users/me 같은 엔드포인트를 호출해 채우도록 한다.
 * ============================================================ */
@Controller
@RequestMapping("/resume")
class ResumePageController {

  private final CurrentUser currentUser;

  public ResumePageController(CurrentUser currentUser) {
    this.currentUser = currentUser;
  }

  // 융합프로젝트 김태형 12주차 : 내 이력서 초안 목록 페이지 매핑
  @GetMapping("/make")
  public String showMakePage() {
    return "resume/Make";
  }

  // 융합프로젝트 김태형 12주차 : 이력서 편집 페이지 매핑
  @GetMapping("/edit")
  public String showEditPage() {
    return "resume/resume-edit";
  }
}
