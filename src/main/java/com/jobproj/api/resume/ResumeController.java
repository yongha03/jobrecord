package com.jobproj.api.resume;

import com.jobproj.api.common.ApiResponse;
import com.jobproj.api.common.PageRequest;
import com.jobproj.api.common.PageResponse;
import com.jobproj.api.resume.ResumeDto.CreateRequest;
import com.jobproj.api.resume.ResumeDto.Response;
import com.jobproj.api.resume.ResumeDto.UpdateRequest;
import com.jobproj.api.security.CurrentUser;
import jakarta.validation.Valid;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

  private final ResumeService service;
  private final CurrentUser currentUser;

  public ResumeController(ResumeService service, CurrentUser currentUser) {
    this.service = service;
    this.currentUser = currentUser;
  }

  @PostMapping
  public ResponseEntity<ApiResponse<Long>> create(@Valid @RequestBody CreateRequest req) {
    Long usersId = currentUser.id();              // 로그인 사용자 id
    Long id = service.create(usersId, req);       // 소유자 id와 함께 생성
    return ResponseEntity.created(URI.create("/api/resumes/" + id))
        .body(ApiResponse.ok("created", id));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<Response>> get(@PathVariable Long id) {
    Long usersId = currentUser.id();              // 소유권 강제
    var opt = service.get(id, usersId);          // (id, usersId) 시그니처
    return opt
        .map(r -> ResponseEntity.ok(ApiResponse.ok(r)))
        .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.fail("resume not found")));
  }

  @GetMapping
  public ResponseEntity<ApiResponse<PageResponse<Response>>> list(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer size,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String keyword) {

    Long usersId = currentUser.id();              // 토큰에서 소유자 추출
    var pr = new PageRequest(page, size, sort);
    var res = service.list(pr, usersId, keyword);
    return ResponseEntity.ok(ApiResponse.ok(res));
  }

  @PatchMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> update(
      @PathVariable Long id,
      @Valid @RequestBody UpdateRequest req) {

    Long usersId = currentUser.id();              // 소유권 강제
    boolean ok = service.update(id, usersId, req);
    return ok
        ? ResponseEntity.ok(ApiResponse.ok(null))
        : ResponseEntity.status(404).body(ApiResponse.fail("resume not found"));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
    Long usersId = currentUser.id();              // 소유권 강제
    boolean ok = service.delete(id, usersId);
    return ok
        ? ResponseEntity.ok(ApiResponse.ok(null))
        : ResponseEntity.status(404).body(ApiResponse.fail("resume not found"));
  }
}
