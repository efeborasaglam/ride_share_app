export const listCars = /* GraphQL */ `
  query ListCars {
    listCars {
      id
      type
      latitude
      longitude
      heading
      isActive
    }
  }
`;

export const createOrder = /* GraphQL */ `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      createdAt
      type
      status
      originLatitude
      originLongitude
      destLatitude
      destLongitude
      userId
      carId
    }
  }
`;

export const getMyProfile = /* GraphQL */ `
  query GetMyProfile {
    getMyProfile {
      id
      displayName
      role
      carType
      verificationStatus
      verifiedAt
    }
  }
`;

export const saveProfile = /* GraphQL */ `
  mutation SaveProfile($input: SaveProfileInput!) {
    saveProfile(input: $input) {
      id
      displayName
      role
      carType
      verificationStatus
      verifiedAt
    }
  }
`;

export const createTrip = /* GraphQL */ `
  mutation CreateTrip($input: CreateTripInput!) {
    createTrip(input: $input) {
      id
    }
  }
`;

export const listMyTrips = /* GraphQL */ `
  query ListMyTrips {
    listMyTrips {
      id
      carType
      originName
      destName
      departureAt
      seats
      seatsLeft
      status
    }
  }
`;

export const listActiveTrips = /* GraphQL */ `
  query ListActiveTrips {
    listActiveTrips {
      id
      driverId
      driverName
      carType
      originName
      destName
      originLatitude
      originLongitude
      destLatitude
      destLongitude
      routePolyline
      departureAt
      seats
      seatsLeft
      status
    }
  }
`;

export const createRideRequest = /* GraphQL */ `
  mutation CreateRideRequest($input: CreateRideRequestInput!) {
    createRideRequest(input: $input) {
      id
      status
    }
  }
`;

export const listMyRequests = /* GraphQL */ `
  query ListMyRequests {
    listMyRequests {
      id
      tripId
      driverName
      carType
      tripOriginName
      tripDestName
      departureAt
      pickupName
      dropoffName
      status
      createdAt
    }
  }
`;

export const listRequestsForMyTrips = /* GraphQL */ `
  query ListRequestsForMyTrips {
    listRequestsForMyTrips {
      id
      tripId
      passengerName
      carType
      tripOriginName
      tripDestName
      departureAt
      pickupName
      pickupLatitude
      pickupLongitude
      dropoffName
      dropoffLatitude
      dropoffLongitude
      status
      createdAt
    }
  }
`;

export const getMyTrip = /* GraphQL */ `
  query GetMyTrip($id: ID!) {
    getMyTrip(id: $id) {
      id
      routePolyline
    }
  }
`;

export const respondToRequest = /* GraphQL */ `
  mutation RespondToRequest($id: ID!, $accept: Boolean!) {
    respondToRequest(id: $id, accept: $accept) {
      id
      status
    }
  }
`;

export const cancelRequest = /* GraphQL */ `
  mutation CancelRequest($id: ID!) {
    cancelRequest(id: $id) {
      id
      status
    }
  }
`;

export const cancelTrip = /* GraphQL */ `
  mutation CancelTrip($id: ID!) {
    cancelTrip(id: $id) {
      id
      status
    }
  }
`;

export const listMessages = /* GraphQL */ `
  query ListMessages($requestId: ID!) {
    listMessages(requestId: $requestId) {
      requestId
      id
      senderId
      senderName
      text
      createdAt
    }
  }
`;

export const sendMessage = /* GraphQL */ `
  mutation SendMessage($requestId: ID!, $text: String!) {
    sendMessage(requestId: $requestId, text: $text) {
      requestId
      id
      senderId
      senderName
      text
      createdAt
    }
  }
`;

export const startVerification = /* GraphQL */ `
  mutation StartVerification {
    startVerification {
      sessionId
      url
      status
    }
  }
`;

export const refreshVerification = /* GraphQL */ `
  mutation RefreshVerification {
    refreshVerification {
      id
      displayName
      role
      carType
      verificationStatus
      verifiedAt
    }
  }
`;

export const getPublicProfile = /* GraphQL */ `
  query GetPublicProfile($userId: ID!) {
    getPublicProfile(userId: $userId) {
      userId
      displayName
      age
      photoUrl
      verified
    }
  }
`;

export const setProfileVisibility = /* GraphQL */ `
  mutation SetProfileVisibility($visible: Boolean!) {
    setProfileVisibility(visible: $visible) {
      id
      displayName
      role
      carType
      verificationStatus
      verifiedAt
      profileVisible
    }
  }
`;

export const startPayoutOnboarding = /* GraphQL */ `
  mutation StartPayoutOnboarding($email: String) {
    startPayoutOnboarding(email: $email) {
      url
    }
  }
`;

export const refreshPayoutStatus = /* GraphQL */ `
  mutation RefreshPayoutStatus {
    refreshPayoutStatus {
      id
      displayName
      role
      carType
      verificationStatus
      verifiedAt
      profileVisible
      payoutsReady
    }
  }
`;
