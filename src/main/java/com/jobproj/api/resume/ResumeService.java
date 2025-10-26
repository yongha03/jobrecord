package com.jobproj.api.resume;

import com.jobproj.api.common.PageRequest;
import com.jobproj.api.common.PageResponse;
import com.jobproj.api.resume.ResumeDto.CreateRequest;
import com.jobproj.api.resume.ResumeDto.Response;
import com.jobproj.api.resume.ResumeDto.UpdateRequest;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResumeService {

  private final ResumeRepository repo;

  /** JWT에서 구한 usersId를 인자로 받아 생성 */
  @Transactional
  public Long create(Long usersId, CreateRequest req) {
    if (usersId == null) throw new IllegalArgumentException("usersId required");
    if (req.title == null || req.title.isBlank())
      throw new IllegalArgumentException("title required");
    return repo.create(usersId, req);
  }

  @Transactional(readOnly = true)
  public Optional<Response> get(Long id) {
    return repo.findById(id);
  }

  @Transactional
  public boolean update(Long id, UpdateRequest req) {
    return repo.update(id, req) > 0;
  }

  @Transactional
  public boolean delete(Long id) {
    return repo.delete(id) > 0;
  }

  @Transactional(readOnly = true)
  public PageResponse<Response> list(PageRequest pr, Long usersId, String keyword) {
    var items = repo.search(pr, usersId, keyword);
    var total = repo.count(usersId, keyword);
    return new PageResponse<>(items, pr.getPage(), pr.getSize(), total);
  }
}
