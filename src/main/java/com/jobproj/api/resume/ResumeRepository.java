package com.jobproj.api.resume;

import com.jobproj.api.common.JdbcUtils;
import com.jobproj.api.common.PageRequest;
import com.jobproj.api.resume.ResumeDto.CreateRequest;
import com.jobproj.api.resume.ResumeDto.Response;
import com.jobproj.api.resume.ResumeDto.UpdateRequest;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

@Repository
public class ResumeRepository {

  private final NamedParameterJdbcTemplate jdbc;

  public ResumeRepository(NamedParameterJdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  // 융합프로젝트 김태형 12주차 : 이력서 기본 정보(이름/전화번호/이메일/생년월일) 컬럼을 포함하도록 RowMapper 확장
  private static final RowMapper<Response> MAPPER =
      (ResultSet rs, int i) ->
          new Response(
              rs.getLong("resume_id"),
              rs.getLong("users_id"),
              rs.getString("title"),
              rs.getString("summary"),
              rs.getInt("is_public") == 1,
              rs.getTimestamp("resume_created_at").toLocalDateTime(),
              rs.getTimestamp("resume_updated_at").toLocalDateTime(),
              rs.getString("resume_full_name"),
              rs.getString("resume_phone"),
              rs.getString("resume_email"),
              rs.getDate("resume_birth_date") != null
                  ? rs.getDate("resume_birth_date").toLocalDate()
                  : null);

  /** usersId를 인자로 받아 INSERT */
  public Long create(Long usersId, CreateRequest req) {
    // 융합프로젝트 김태형 12주차 : INSERT 시 이력서 기본 정보(이름/전화번호/이메일/생년월일) 컬럼 저장
    String sql =
        """
      INSERT INTO jobproject_resume
        (users_id, title, summary, is_public, resume_created_at, resume_updated_at,
         resume_full_name, resume_phone, resume_email, resume_birth_date)
      VALUES (:usersId, :title, :summary, :isPublic, :now, :now,
              :name, :phone, :email, :birthDate)
      """;
    var params =
        new MapSqlParameterSource()
            .addValue("usersId", usersId)
            .addValue("title", req.title)
            .addValue("summary", req.summary)
            .addValue("isPublic", Boolean.TRUE.equals(req.isPublic) ? 1 : 0)
            .addValue("now", Timestamp.valueOf(LocalDateTime.now()))
            // 융합프로젝트 김태형 12주차 : INSERT 파라미터에 기본 정보 값 매핑
            .addValue("name", req.name)
            .addValue("phone", req.phone)
            .addValue("email", req.email)
            .addValue("birthDate", req.birthDate);
    var kh = new GeneratedKeyHolder();
    jdbc.update(sql, params, kh, new String[] {"resume_id"});
    return kh.getKey().longValue();
  }

  // --- 기존 단건조회(소유권 미검증): 남겨두되 서비스에서는 더이상 직접 사용 X
  public Optional<Response> findById(Long id) {
    try {
      // 융합프로젝트 김태형 12주차 : SELECT 시 이력서 기본 정보 컬럼 포함
      String sql =
          """
        SELECT resume_id, users_id, title, summary, is_public,
               resume_created_at, resume_updated_at,
               resume_full_name, resume_phone, resume_email, resume_birth_date
        FROM jobproject_resume
        WHERE resume_id = :id
        """;
      return Optional.ofNullable(jdbc.queryForObject(sql, Map.of("id", id), MAPPER));
    } catch (EmptyResultDataAccessException e) {
      return Optional.empty();
    }
  }

  // 소유자까지 조건을 포함한 단건 조회
  public Optional<Response> findByIdAndUsersId(Long id, Long usersId) {
    try {
      // 융합프로젝트 김태형 12주차 : SELECT 시 이력서 기본 정보 컬럼 포함
      String sql =
          """
        SELECT resume_id, users_id, title, summary, is_public,
               resume_created_at, resume_updated_at,
               resume_full_name, resume_phone, resume_email, resume_birth_date
        FROM jobproject_resume
        WHERE resume_id = :id AND users_id = :usersId
        """;
      var params =
          new MapSqlParameterSource()
              .addValue("id", id)
              .addValue("usersId", usersId);
      return Optional.ofNullable(jdbc.queryForObject(sql, params, MAPPER));
    } catch (EmptyResultDataAccessException e) {
      return Optional.empty();
    }
  }

  // owner 빠른 확인(404/403 분기용)
  public Optional<Long> findOwnerId(Long resumeId) {
    try {
      String sql =
          "SELECT users_id FROM jobproject_resume WHERE resume_id = :id";
      Long uid = jdbc.queryForObject(sql, Map.of("id", resumeId), Long.class);
      return Optional.ofNullable(uid);
    } catch (EmptyResultDataAccessException e) {
      return Optional.empty();
    }
  }

  // --- 기존 update/delete(소유권 미검증): 남겨두되 서비스에서 사용하지 않도록 함
  public int update(Long id, UpdateRequest req) {
    // 융합프로젝트 김태형 12주차 : 이력서 기본 정보 컬럼까지 함께 업데이트
    String sql =
        """
      UPDATE jobproject_resume
         SET title = :title,
             summary = :summary,
             is_public = :isPublic,
             resume_updated_at = :now,
             resume_full_name = :name,
             resume_phone = :phone,
             resume_email = :email,
             resume_birth_date = :birthDate
       WHERE resume_id = :id
      """;
    return jdbc.update(
        sql,
        new MapSqlParameterSource()
            .addValue("title", req.title)
            .addValue("summary", req.summary)
            .addValue("isPublic", Boolean.TRUE.equals(req.isPublic) ? 1 : 0)
            .addValue("now", Timestamp.valueOf(LocalDateTime.now()))
            // 융합프로젝트 김태형 12주차 : UPDATE 파라미터에 기본 정보 값 매핑
            .addValue("name", req.name)
            .addValue("phone", req.phone)
            .addValue("email", req.email)
            .addValue("birthDate", req.birthDate)
            .addValue("id", id));
  }

  public int delete(Long id) {
    String sql =
        "DELETE FROM jobproject_resume WHERE resume_id = :id";
    return jdbc.update(sql, Map.of("id", id));
  }

  // 소유자 조건 포함 업데이트
  public int updateByOwner(Long id, Long usersId, UpdateRequest req) {
    // 융합프로젝트 김태형 12주차 : 소유자 조건 업데이트에도 기본 정보 컬럼 포함
    String sql =
        """
      UPDATE jobproject_resume
         SET title = :title,
             summary = :summary,
             is_public = :isPublic,
             resume_updated_at = :now,
             resume_full_name = :name,
             resume_phone = :phone,
             resume_email = :email,
             resume_birth_date = :birthDate
       WHERE resume_id = :id AND users_id = :usersId
      """;
    return jdbc.update(
        sql,
        new MapSqlParameterSource()
            .addValue("title", req.title)
            .addValue("summary", req.summary)
            .addValue("isPublic", Boolean.TRUE.equals(req.isPublic) ? 1 : 0)
            .addValue("now", Timestamp.valueOf(LocalDateTime.now()))
            // 융합프로젝트 김태형 12주차 : UPDATE(소유자조건) 파라미터에 기본 정보 값 매핑
            .addValue("name", req.name)
            .addValue("phone", req.phone)
            .addValue("email", req.email)
            .addValue("birthDate", req.birthDate)
            .addValue("id", id)
            .addValue("usersId", usersId));
  }

  // 소유자 조건 포함 삭제
  public int deleteByOwner(Long id, Long usersId) {
    String sql =
        "DELETE FROM jobproject_resume " +
        "WHERE resume_id = :id AND users_id = :usersId";
    return jdbc.update(
        sql,
        new MapSqlParameterSource()
            .addValue("id", id)
            .addValue("usersId", usersId));
  }

  public List<Response> search(PageRequest pr, Long usersId, String keyword) {
    Map<String, String> sortMap =
        Map.of(
            "created_at", "resume_created_at",
            "updated_at", "resume_updated_at",
            "title", "title");
    String where = " WHERE users_id = :usersId ";
    where += JdbcUtils.whereLike(keyword, "title", "summary");

    // 융합프로젝트 김태형 12주차 : 목록 조회 SELECT에도 이력서 기본 정보 컬럼 포함
    String sql =
        """
      SELECT resume_id, users_id, title, summary, is_public,
             resume_created_at, resume_updated_at,
             resume_full_name, resume_phone, resume_email, resume_birth_date
      FROM jobproject_resume
      """
            + where
            + JdbcUtils.orderBy(pr.getSort(), sortMap)
            + " LIMIT :limit OFFSET :offset";

    var params =
        new MapSqlParameterSource()
            .addValue("usersId", usersId)
            .addValue(
                "kw",
                (keyword == null || keyword.isBlank())
                    ? null
                    : "%" + keyword + "%")
            .addValue("limit", pr.getSize())
            .addValue("offset", pr.offset());

    return jdbc.query(sql, params, MAPPER);
  }

  public long count(Long usersId, String keyword) {
    String where = " WHERE users_id = :usersId ";
    where += JdbcUtils.whereLike(keyword, "title", "summary");
    String sql =
        "SELECT COUNT(*) FROM jobproject_resume " + where;
    var params =
        new MapSqlParameterSource()
            .addValue("usersId", usersId)
            .addValue(
                "kw",
                (keyword == null || keyword.isBlank())
                    ? null
                    : "%" + keyword + "%");
    return jdbc.queryForObject(sql, params, Long.class);
  }
}
