package com.jobproj.api.dto;

public class ResumeDto {
  private Long id;
  private Long userId;
  private String title;
  private String summary;
  private boolean isPublic;

  public ResumeDto(Long id, Long u, String t, String s, boolean p) {
    this.id = id;
    this.userId = u;
    this.title = t;
    this.summary = s;
    this.isPublic = p;
  }

  public Long getId() {
    return id;
  }

  public Long getUserId() {
    return userId;
  }

  public String getTitle() {
    return title;
  }

  public String getSummary() {
    return summary;
  }

  public boolean getIsPublic() {
    return isPublic;
  }
}
