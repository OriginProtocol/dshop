import React from 'react'
import fbt from 'fbt'
import { Article as ArticleIcon } from 'components/icons/Admin'

const ArticleItem = ({ article }) => {
  if (!article) return null

  return (
    <div className="task-item article">
      <div>
        <ArticleIcon />
        <div className="task-data">
          <div className="task-name">{article.title}</div>
          <div className="task-desc">
            {article.summary}
            <a
              href={article.link}
              className="btn btn-link px-0 d-block text-left"
              target="_blank"
              rel="noopener noreferrer"
            >
              <fbt desc="component.onboarding.ArticleItem.continueReading">
                Continue reading
              </fbt>{' '}
              &raquo;
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArticleItem

require('react-styl')(`
  .task-item.article
    > div:first-child
      cursor: default
`)
