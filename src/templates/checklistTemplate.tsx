import React, { FC, useContext, useLayoutEffect } from 'react';
import { graphql } from 'gatsby';
import RehypeReact from 'rehype-react';

import { ChecklistDetailQuery } from '../../graphql-types';
import { categoryTheme, Category } from '../utils/category';

import ListItem from '../components/ListItem';
import Layout from '../components/Layout';
import TagList from '../components/TagList';
import Checklist from '../components/Checklist';
import Button from '../components/Button';
import LinkCategory from '../components/links/LinkCategory';
import ButtonAsAnchor from '../components/Button/ButtonAsAnchor';
import Checklists from '../components/Checklists';
import activeChecklistContext from '../context/activeChecklist';
import SEO from '../containers/SEO';
import todosContext from '../context/todos';
import todoStore from '../store/todo';

import './o-checklist-detail-section.scss';
import './o-related-checklists-section.scss';

const renderAst = new RehypeReact({
  createElement: React.createElement,
  components: {
    ul: Checklist,
    li: ListItem,
  },
}).Compiler;

interface Props {
  data: ChecklistDetailQuery;
  pageContext: { slug: string };
}

const ChecklistTemplate: FC<Props> = ({ data, pageContext }) => {
  const { activeChecklist, setActiveChecklist } = useContext(activeChecklistContext);
  const { setTodos } = useContext(todosContext);
  const { markdownRemark, relatedChecklists } = data;
  const { slug } = pageContext;

  useLayoutEffect(() => {
    if (slug) {
      setActiveChecklist(slug);
    }
  }, [slug]);

  useLayoutEffect(() => {
    if (activeChecklist) {
      const todos = todoStore.get(activeChecklist);
      setTodos(todos);
    }
  }, [activeChecklist]);

  const frontmatter = markdownRemark?.frontmatter;
  const fields = markdownRemark?.fields;

  if (!frontmatter || !frontmatter.title || !frontmatter.tags || !frontmatter.description) {
    return null;
  }

  if (!fields || !fields.categorySlug) {
    return null;
  }

  const html = renderAst(markdownRemark?.htmlAst);

  const handleReset = () => {
    setTodos([]);
    window.scrollTo(0, 0);
  };

  return (
    <Layout>
      <SEO title={frontmatter?.title} description={frontmatter?.description} />
      <div className="row o-checklist-detail-section">
        <div className="col col--lg-8">
          <LinkCategory category={fields.categorySlug} size="medium">
            {frontmatter.category}
          </LinkCategory>

          <h1 className="u-margin-ends-small">{frontmatter.title}</h1>
          <TagList
            tags={frontmatter.tags as string[]}
            size="small"
            theme={categoryTheme[fields.categorySlug as Category]}
          />
          <p className="u-margin-top u-text-style-large-body u-color-secondary">
            {frontmatter.description}
          </p>

          <div className="u-padding-ends-xlarge@xl-up u-padding-ends-large@lg-down">{html}</div>
          <div className="row">
            <div className="col u-width-auto@md-up">
              <Button className="u-width-100%@sm-down" onClick={handleReset}>
                Reset
              </Button>
            </div>
            <div className="col u-width-auto@md-up u-margin-top-small@sm-down">
              <ButtonAsAnchor
                theme="secondary"
                href="https://github.com/atolye15/checklist/blob/master/CONTRIBUTING.md"
                target="_blank"
                rel="noopener noreferrer"
                className="u-width-100%@sm-down"
              >
                Improve this Checklist
              </ButtonAsAnchor>
            </div>
          </div>
        </div>
      </div>
      {relatedChecklists.nodes.length > 0 && (
        <>
          <hr className="u-margin-ends-0 u-color-primary-900" />
          <div className="o-related-checklists-section">
            <h2 className="u-margin-bottom-medium">Related Checklists</h2>
            <Checklists items={relatedChecklists.nodes} />
          </div>
        </>
      )}
    </Layout>
  );
};

export const pageQuery = graphql`
  query ChecklistDetail($slug: String!, $categorySlug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      htmlAst
      frontmatter {
        title
        tags
        category
        description
      }
      fields {
        categorySlug
      }
    }

    relatedChecklists: allMarkdownRemark(
      limit: 3
      filter: { fields: { slug: { ne: $slug }, categorySlug: { eq: $categorySlug } } }
      sort: { fields: [frontmatter___date], order: [DESC] }
    ) {
      nodes {
        ...Checklist
      }
    }
  }
`;

export default ChecklistTemplate;
