import { gql } from 'apollo-boost';

export const ME = gql`
  query me {
    user(login: "roaris") {
      name
    }
  }
`
