package com.mailflow.es;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@Document(indexName = "emails")
public class EmailDocument {

    @Id
    private String id;

    @Field(type = FieldType.Keyword)
    private String userId;

    @Field(type = FieldType.Keyword)
    private String accountId;

    @Field(type = FieldType.Keyword)
    private String messageId;

    @Field(type = FieldType.Keyword)
    private String from;

    @Field(type = FieldType.Keyword)
    private List<String> to;

    @Field(type = FieldType.Keyword)
    private List<String> cc;

    @Field(type = FieldType.Text, analyzer = "english")
    private String subject;

    @Field(type = FieldType.Text, analyzer = "english")
    private String bodyText;

    // stored but not indexed — rendered only
    @Field(type = FieldType.Keyword, index = false)
    private String bodyHtml;

    @Field(type = FieldType.Keyword)
    private List<String> labels;

    @Field(type = FieldType.Boolean)
    private boolean isRead;

    @Field(type = FieldType.Date)
    private Instant receivedAt;
}
