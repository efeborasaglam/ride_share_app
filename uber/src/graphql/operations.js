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
