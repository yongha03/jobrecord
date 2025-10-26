package com.jobproj.api.section.education;

import com.jobproj.api.common.ApiResponse;
import com.jobproj.api.common.PageRequest;
import com.jobproj.api.common.PageResponse;
import com.jobproj.api.section.education.EducationDto.CreateRequest;
import com.jobproj.api.section.education.EducationDto.Response;
import com.jobproj.api.section.education.EducationDto.UpdateRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class EducationController {

  private final EducationService svc;

  public EducationController(EducationService svc) {
    this.svc = svc;
  }

  @PostMapping("/resumes/{resumeId}/educations")
  public ApiResponse<Long> create(@PathVariable long resumeId, @RequestBody CreateRequest r) {
    r.resumeId = resumeId;
    var id = svc.create(r);
    return ApiResponse.ok(id);
  }

  @GetMapping("/resumes/{resumeId}/educations")
  public ApiResponse<PageResponse<Response>> list(
      @PathVariable long resumeId,
      @RequestParam(defaultValue = "0") Integer page,
      @RequestParam(defaultValue = "10") Integer size,
      @RequestParam(required = false) String sort) {
    var pr = new PageRequest(page, size, sort);
    var res = svc.listByResume(resumeId, pr);
    return ApiResponse.<PageResponse<Response>>ok(res); // 제네릭 명시
  }

  @GetMapping("/educations/{id}")
  public ApiResponse<Response> get(@PathVariable long id) {
    return svc.get(id)
        .map(ApiResponse::ok)
        .orElseGet(() -> ApiResponse.fail("NOT_FOUND", "education not found"));
  }

  @PutMapping("/educations/{id}")
  public ApiResponse<?> update(@PathVariable long id, @RequestBody UpdateRequest r) {
    return svc.update(id, r)
        ? ApiResponse.ok("updated", true)
        : ApiResponse.fail("NOT_FOUND", "education not found");
  }

  @DeleteMapping("/educations/{id}")
  public ApiResponse<?> delete(@PathVariable long id) {
    return svc.delete(id)
        ? ApiResponse.ok("deleted", true)
        : ApiResponse.fail("NOT_FOUND", "education not found");
  }
}
