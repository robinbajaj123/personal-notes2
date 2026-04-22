package com.mailflow.es;

import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

public interface EmailRepository extends ElasticsearchRepository<EmailDocument, String> {
}
