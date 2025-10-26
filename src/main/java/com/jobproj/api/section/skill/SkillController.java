package com.jobproj.api.section.skill;

import com.jobproj.api.common.ApiResponse;
import com.jobproj.api.section.skill.SkillDto.*;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping
public class SkillController {
  private final SkillService svc;

  public SkillController(SkillService svc) {
    this.svc = svc;
  }

  // ---- Skill master ----
  @PostMapping("/skills")
  public ApiResponse<Long> create(@RequestBody SkillCreate r) {
    return ApiResponse.ok(svc.create(r));
  }

  @GetMapping("/skills")
  public ApiResponse<List<SkillResponse>> search(
      @RequestParam(required = false) String q, @RequestParam(defaultValue = "50") int limit) {
    return ApiResponse.ok(svc.search(q, Math.min(Math.max(1, limit), 100)));
  }

  @GetMapping("/skills/{id}")
  public ApiResponse<?> get(@PathVariable long id) {
    return svc.get(id)
        .<ApiResponse<?>>map(ApiResponse::ok)
        .orElseGet(() -> ApiResponse.fail("NOT_FOUND", "skill not found"));
  }

  @PutMapping("/skills/{id}")
  public ApiResponse<?> update(@PathVariable long id, @RequestBody SkillUpdate r) {
    return svc.update(id, r)
        ? ApiResponse.ok(true)
        : ApiResponse.fail("NOT_FOUND", "skill not found");
  }

  @DeleteMapping("/skills/{id}")
  public ApiResponse<?> delete(@PathVariable long id) {
    return svc.delete(id) ? ApiResponse.ok(true) : ApiResponse.fail("NOT_FOUND", "skill not found");
  }

  // ---- Resume-Skill mapping ----
  @PutMapping("/resumes/{resumeId}/skills/{skillId}")
  public ApiResponse<?> upsert(
      @PathVariable long resumeId, @PathVariable long skillId, @RequestBody ResumeSkillUpsert r) {
    var p = r.proficiency() == null ? 0 : r.proficiency();
    return ApiResponse.ok(svc.upsert(resumeId, skillId, p));
  }

  @GetMapping("/resumes/{resumeId}/skills")
  public ApiResponse<List<ResumeSkillResponse>> list(@PathVariable long resumeId) {
    return ApiResponse.ok(svc.listByResume(resumeId));
  }

  @DeleteMapping("/resumes/{resumeId}/skills/{skillId}")
  public ApiResponse<?> remove(@PathVariable long resumeId, @PathVariable long skillId) {
    return ApiResponse.ok(svc.remove(resumeId, skillId));
  }
}
