import React, { useState } from 'react';
import { ApolloProvider, Query, Mutation } from 'react-apollo';
import client from './client';
import { SEARCH_REPOSITORIES, ADD_STAR, REMOVE_STAR } from './graphql'

const StarButton = ({ node, query, first, last, before, after }) => {
  const totalCount = node.stargazers.totalCount;
  const viewerHasStarred = node.viewerHasStarred;
  const starCount = totalCount === 1 ? '1 star' : `${totalCount} stars`;
  const StarStatus = ({addOrRemoveStar}) => { // propsはオブジェクトなので、分割代入が使える
    return (
      <button onClick={
        () => {
          addOrRemoveStar({
            variables: { input: { starrableId: node.id }},
            update: (store, { data: { addStar, removeStar }}) => {
              const { starrable } = addStar || removeStar;
              const data = store.readQuery({ // storeはキャッシュ キャッシュのデータを読み出す
                query: SEARCH_REPOSITORIES,
                variables: { query, first, last, after, before }
              });
              const edges = data.search.edges;
              const newEdges = edges.map(edge => {
                if (edge.node.id === node.id) {
                  const totalCount = edge.node.stargazers.totalCount;
                  const diff = starrable.viewerHasStarred ? 1 : -1;
                  const newTotalCount = totalCount + diff;
                  edge.node.stargazers.totalCount = newTotalCount;
                }
                return edge;
              });
              data.search.edges = newEdges;
              store.writeQuery({ query: SEARCH_REPOSITORIES, data }); // キャッシュを書き換える
            }
          })
        }
      }>
        {starCount} | {viewerHasStarred ? 'starred' : '-'}
      </button>
    );
  }
  return (
    <Mutation
      mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR}
    >
      {
        addOrRemoveStar => <StarStatus addOrRemoveStar={addOrRemoveStar}/>
      }
    </Mutation>
  );
};

const PER_PAGE = 5;

const DEFAULT_STATE = {
  first: PER_PAGE,
  after: null,
  last: null,
  before: null,
  query: ''
};

const App = () => {
  const [variables, setVariables] = useState(DEFAULT_STATE);
  const { query, first, last, before, after } = variables;
  const ref = React.createRef();

  const handleSubmit = (e) => {
    e.preventDefault(); // デフォルト動作(リロード)を防ぐ
    setVariables({
      query: ref.current.value,
      first: PER_PAGE,
      after: null,
      last: null,
      before: null,
    })
  };

  const goPrevious = (search) => {
    setVariables({
      ...variables,
      first: null,
      after: null,
      last: PER_PAGE,
      before: search.pageInfo.startCursor,
    })
  }

  const goNext = (search) => {
    setVariables({
      ...variables,
      first: PER_PAGE,
      after: search.pageInfo.endCursor,
      last: null,
      before: null,
    })
  };

  return (
    <ApolloProvider client={client}>
      <form onSubmit={handleSubmit}>
        <input ref={ref} />
        <input type='submit' value='submit' />
      </form>
      <Query
        query={SEARCH_REPOSITORIES}
        variables={{ query, first, last, before, after}}
      >
        {
          ({ loading, error, data }) => {
            if (loading) return 'Loading...';
            if (error) return `Error! ${error.message}`

            const search = data.search;
            const repositoryCount = search.repositoryCount;
            const repositoryUnit = repositoryCount === 1 ? 'Repository' : 'Repositories';
            const title = `GitHub Repositories Search Results - ${repositoryCount} ${repositoryUnit}`
            return (
              <>
                <h2>{title}</h2>
                <ul>
                  {
                    search.edges.map(edge => {
                      const node = edge.node;
                      return (
                        <li key={node.id}>
                          {/* target="_blank" だけだと、リンク先のページからリンク元のページを操作できてしまう */}
                          <a href={node.url} target="_blank" rel="noopener noreferrer">{node.name}</a>
                          &nbsp;
                          <StarButton node={node} {...{query, first, last, before, after}} />
                        </li>
                      )
                    })
                  }
                </ul>
                {
                  search.pageInfo.hasPreviousPage && <button onClick={() => goPrevious(search)}>Previous</button>
                }
                {
                  search.pageInfo.hasNextPage && <button onClick={() => goNext(search)}>Next</button>
                }
              </>
            )
          }
        }
      </Query>
    </ApolloProvider>
  );
}

export default App;
