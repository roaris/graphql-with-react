# graphql_with_react

- https://www.udemy.com/course/graphql-with-react/
- RESTに比べて柔軟にデータを取ることができるのがメリット

## GraphiQL
- GraphQLを簡単に試すことができる
- [GitHubのGraphiQL](https://docs.github.com/en/graphql/overview/explorer)
- リクエストの内容はnetworkタブから確認できる
- リクエストは必ずPOSTメソッド
- `Prettify`を押すと、コードの整形やクエリの余計な部分を取り除くことができる

## query, field, operation name
リクエスト
```graphql
query fetchViewer {
  viewer {
    login
  }
  user(login: "roaris") {
    bio
  }
}
```
レスポンス
```graphql
{
  "data": {
    "viewer": {
      "login": "roaris"
    },
    "user": {
      "bio": ""
    }
  }
}
```
- operation nameとして`fetchViewer`を使っている operation nameがあると、queryは省略できない
- `viewer`, `user`, `login`はFieldと呼ばれるもの
- `user`に引数を指定して、該当のユーザーの情報を取得している
- Fieldの型はドキュメントを見て確かめる !がついているものはnullが許容されない (ex. `String!`など)

## エイリアス
- 2ユーザーの情報を一度に取得するために以下のようなクエリを書くと、エラーになる

リクエスト
```graphql
{
  user(login: "roaris") {
    bio
    login
  }
  user(login: "one0803") {
    bio
    login
  }
}
```

レスポンス
```graphql
{
  "errors": [
    {
      "path": [],
      "extensions": {
        "code": "fieldConflict",
        "fieldName": "user",
        "conflicts": "{login:\"\\\"roaris\\\"\"} or {login:\"\\\"one0803\\\"\"}"
      },
      "locations": [
        {
          "line": 2,
          "column": 3
        },
        {
          "line": 6,
          "column": 3
        }
      ],
      "message": "Field 'user' has an argument conflict: {login:\"\\\"roaris\\\"\"} or {login:\"\\\"one0803\\\"\"}?"
    }
  ]
}
```

- `locations`にエラー箇所、`message`にエラー文が入っている
- 同一のFieldを並べることはできないというエラー
- エイリアスを使うことでエラーを回避できる

リクエスト
```graphql
{
  user1: user(login: "roaris") {
    bio
    login
  }
  user2: user(login: "one0803") {
    bio
    login
  }
}
```

レスポンス
```graphql
{
  "data": {
    "user1": {
      "bio": "",
      "login": "roaris"
    },
    "user2": {
      "bio": "",
      "login": "one0803"
    }
  }
}
```

## fragment
- `fragment`を使うことで、取り出したい共通Fieldを定義することができる

リクエスト
```graphql
{
  user1: user(login: "roaris") {
    ...commonFields
  }
  user2: user(login: "one0803") {
    ...commonFields
  }
}

fragment commonFields on User {
  bio
  login
  avatarUrl
  bioHTML
  company
  companyHTML
  createdAt
}
```

## operation name
- 複数のリクエストを書くときは、OperationNameをつける(リクエストを区別するため)

```graphql
query getUser1 {
  user(login: "roaris") {
    bio
  }
}

query getUser2 {
  user(login: "one0803") {
    bio
  }
}
```

## 変数
- 変数はJSON形式で定義する queryも引数を使えるように書き換える必要がある

```graphql
{
  "login": "roaris"
}
```

```graphql
query ($login: String!) {
  user(login: $login) {
    bio
    name
  }
}
```

## mutation
- データの作成、更新、削除にはqueryではなく、mutationを使う
- GitHubのレポジトリにスターをつける/スターを取り消す操作を行うときは以下のようにクエリを書く

```graphql
query repository {
  repository(owner: "roaris", name: "ShareFolio") {
    id
    name
    url
  }
}

mutation addStar {
  addStar(input: {
    starrableId: "R_kgDOGF8QVg"
  }) {
    starrable {
      id
      viewerHasStarred
    }
  }
}

mutation removeStar {
  removeStar(input: {
    starrableId: "R_kgDOGF8QVg"
  }) {
    starrable {
      id
      viewerHasStarred
    }
  }
}
```

- `addStar`, `removeStar`の引数にレポジトリのidが必要なため、queryで取得している

## inline fragment
- 返ってくるデータの型が複数ある場合は、inline fragmentを使う
- `search`の`type`に`USER`を指定すると、型`User`または型`Organization`のデータが返ってくる

リクエスト
```graphql
query search {
  search (query: "We work hard", type: USER, first: 2) {
    nodes {
      ... on User {
        id
        name
        url
      }
      ... on Organization {
        id
        name
        url
        projectsUrl
      }
    }
  }
}
```

レスポンス
```graphql
{
  "data": {
    "search": {
      "nodes": [
        {
          "id": "MDQ6VXNlcjI5NTIxMTQz",
          "name": "oath-oath",
          "url": "https://github.com/webengineergh"
        },
        {
          "id": "MDEyOk9yZ2FuaXphdGlvbjEyNjI0Njc1",
          "name": "WeFlex We Code",
          "url": "https://github.com/weflex",
          "projectsUrl": "https://github.com/orgs/weflex/projects"
        }
      ]
    }
  }
}
```

- 型が`User`であれば、`id`,`name`,`url`、`Organization`であれば、`id`,`name`,`url`,`projectsUrl`を返すように指定している
- 各データの型を知りたい時は、`__typename`を使う

リクエスト
```graphql
query searchWithTypeName {
  search (query: "We work hard", type: USER, first: 2) {
    nodes {
      __typename
      ... on User {
        id
        name
        url
      }
      ... on Organization {
        id
        name
        url
      }
    }
  }
}
```

レスポンス
```graphql
{
  "data": {
    "search": {
      "nodes": [
        {
          "__typename": "User",
          "id": "MDQ6VXNlcjI5NTIxMTQz",
          "name": "oath-oath",
          "url": "https://github.com/webengineergh"
        },
        {
          "__typename": "Organization",
          "id": "MDEyOk9yZ2FuaXphdGlvbjEyNjI0Njc1",
          "name": "WeFlex We Code",
          "url": "https://github.com/weflex"
        }
      ]
    }
  }
}
```

## 型
- ドキュメントの黄色のリンクは全て型
- スカラ型: これ以上分解できない型
- オブジェクト型: スカラ型を組み合わせた型

## ページネーション(Relay-Style Cursor Pagination)
- ページネーションの実装方法は自由だが、GitHubでも用いられおり、デファクトスタンダートである、Relay-Style Cursor Paginationに従うのが一般的

リクエスト
```graphql
query searchRepositories($first: Int, $after: String, $last: Int, $before: String, $query: String!) {
  search(first: $first, after: $after, last: $last, before: $before, query: $query, type: REPOSITORY) {
    repositoryCount
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
    edges {
      cursor
      node {
        ... on Repository {
          id
          name
          url
        }
      }
    }
  }
}
```

- `search`には`first`, `after`, `last`, `before`, `query`を指定する `query`は検索ワード `first`は最初から何件取得するか `last`は最後から何件取得するか `first`と`last`は両方指定するとエラーになる(片方はnullにする必要がある) `after`にはカーソルの位置を指定して、その位置以降のデータを取得する `before`にもカーソルの位置を指定して、その位置以前のデータを取得する
- 利用パターンとしては以下の3つ
  - `after`と`last`をnullにして、`first`を指定する
  - `after`を指定して、`first`を指定する
  - `before`を指定して、`last`を指定する
- 返ってくるデータには主に`pageInfo`と`edges`がある `pageInfo`はページネーションを補助するための情報、`edges`は`edge`の集まりで、`edge`には`cursor`と`node`などが含まれる 実際のデータ(上の例だとレポジトリのデータ)が`node`に入る
- `pageInfo`の`startCursor`,`endCursor`はそれぞれ先頭のカーソル位置と、末端のカーソル位置、`hasNextPage`,`hasPreviousPage`はそれぞれ次のページが存在するか、前のページが存在するかである

レスポンス
```graphql
{
  "data": {
    "search": {
      "repositoryCount": 59,
      "pageInfo": {
        "endCursor": "Y3Vyc29yOjk=",
        "hasNextPage": true,
        "hasPreviousPage": true,
        "startCursor": "Y3Vyc29yOjU="
      },
      "edges": [
        {
          "cursor": "Y3Vyc29yOjU=",
          "node": {
            "id": "MDEwOlJlcG9zaXRvcnkzMTkwMTQ3NzY=",
            "name": "Frontend-study",
            "url": "https://github.com/TERADA-DANTE/Frontend-study"
          }
        },
        {
          "cursor": "Y3Vyc29yOjY=",
          "node": {
            "id": "R_kgDOGWFn9A",
            "name": "frontend-wants",
            "url": "https://github.com/euxn23/frontend-wants"
          }
        },
        {
          "cursor": "Y3Vyc29yOjc=",
          "node": {
            "id": "MDEwOlJlcG9zaXRvcnkxMzMwNjMxOTE=",
            "name": "react-recipes",
            "url": "https://github.com/ProgrammingSamurai/react-recipes"
          }
        },
        {
          "cursor": "Y3Vyc29yOjg=",
          "node": {
            "id": "MDEwOlJlcG9zaXRvcnk4MDgwMzYyOQ==",
            "name": "fe-colosseum",
            "url": "https://github.com/wakamor/fe-colosseum"
          }
        },
        {
          "cursor": "Y3Vyc29yOjk=",
          "node": {
            "id": "MDEwOlJlcG9zaXRvcnkyNjM3ODUyMzc=",
            "name": "udemy-React-App",
            "url": "https://github.com/chiakihonda/udemy-React-App"
          }
        }
      ]
    }
  }
}
```

- `cursor`はbase64で暗号化されている 複合すると以下のようになる

```javascript
const cursors = [
    "Y3Vyc29yOjE=",
    "Y3Vyc29yOjI=",
    "Y3Vyc29yOjM=",
    "Y3Vyc29yOjQ=",
    "Y3Vyc29yOjU=",
]
const results = cursors.map(cursor => {
    return new Buffer(cursor, "base64").toString("binary")
})
console.log(results)
```

```
[ 'cursor:1', 'cursor:2', 'cursor:3', 'cursor:4', 'cursor:5' ]
```
