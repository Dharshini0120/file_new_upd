import { gql } from '@apollo/client';

// Admin Management Query
export const GET_ALL_ADMIN_USERS = gql`
  query AdminListUsers($page: Int!, $limit: Int!) {
    adminlistUsers(page: $page, limit: $limit) {
      status
      message
      statusCode
      data
    }
  }
`;

// Hospital Management Query
export const GET_ALL_HOSPITAL_USERS = gql`
  query ListUsers($page: Int!, $limit: Int!) {
    listUsers(page: $page, limit: $limit) {
      status
      message
      statusCode
      data
    }
  }
`;

// Legacy query for backward compatibility
export const GET_ALL_USERS = gql`
  query AdminListUsers {
    adminlistUsers(page: 1, limit: 10) {
      status
      message
      statusCode
      data
    }
  }
`;


export const GET_ALL_FACILITY_TYPES = gql`
  query GetAllFacilityTypes {
    getAllFacilityTypes {
      status
      message
      statusCode
      data
      error
    }
  }
`;

export const GET_SERVICE_LINES = gql`
  query GetServiceLines {
    getServiceLines {
      status
      message
      statusCode
      data
      error
    }
  }
`;



export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      status
      message
      statusCode
      data
      error
    }
  }
`;

export const ADMIN_CREATE_USER_MUTATION = gql`
  mutation AdminCreateUser($input: AdminCreateUserInput!) {
    admincreateUser(input: $input) {
      status
      message
      statusCode
      data
      error
    }
  }
`;

export const ADMIN_GET_USER_BY_ID = gql`
  query AdminGetUser($userId: String!) {
    admingetUserById(userId: $userId) {
      status
      message
      statusCode
      data
      error
    }
  }
`;

export const ADMIN_UPDATE_USER_MUTATION = gql`
  mutation AdminUpdateUser($userId: String!, $input: UpdateUserInput!) {
    adminupdateUser(userId: $userId, input: $input) {
      status
      message
      statusCode
      data
      error
    }
  }
`;

export const UPDATE_USER_STATUS_MUTATION = gql`
  mutation UpdateUserStatus($input: UpdateUserStatusInput!) {
    UpdateUserStatus(input: $input) {
      status
      message
      statusCode
      error
    }
  }
`;

export const UPDATE_USER_STATUS_MUTATION = gql`
  mutation UpdateUserStatus($input: UserStatusInput!) {
    UpdateUserStatus(input: $input) {
      status
      message
      statusCode
      data
      error
    }
  }
`;

export const GET_USER_BY_ID = gql`
  query GetUserById($userId: String!) {
    getUserById(userId: $userId) {
      status
      message
      statusCode
      data
      error
    }
  }
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($userId: String!, $input: UpdateUserInput!) {
    updateUser(userId: $userId, input: $input) {
      status
      message
      statusCode
      data
      error
    }
  }
`;
export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($userId: String!) {
    deleteUser(userId: $userId) {
      status
      message
      statusCode
      data
      error
    }
  }
`;
