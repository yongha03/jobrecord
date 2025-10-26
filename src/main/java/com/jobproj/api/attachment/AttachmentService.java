package com.jobproj.api.attachment;

import com.jobproj.api.attachment.AttachmentDto.*;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttachmentService {

  private final AttachmentRepository repo;

  public AttachmentService(AttachmentRepository repo) {
    this.repo = repo;
  }

  public long create(CreateRequest r) {
    return repo.create(r);
  }

  public List<Response> listByResume(long resumeId) {
    return repo.listByResume(resumeId);
  }

  public boolean delete(long id) {
    return repo.delete(id) > 0;
  }

  @Transactional
  public boolean setProfile(long resumeId, long attachmentId) {
    // 내부적으로 전체 0으로 초기화 후 대상 1 설정 (2번 UPDATE) → 트랜잭션으로 보호
    return repo.setProfile(resumeId, attachmentId) > 0;
  }
}
