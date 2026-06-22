import { User } from '../models/User';
import { lookupRequestGeoLocation } from '../services/geoip.service';

export const locationResolvers = {
  Query: {
    getMyIpGeolocation: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const result = await lookupRequestGeoLocation(context?.req);

      // Auto-save the IP-detected location to the user's record so they appear on the map
      if (result.latitude != null && result.longitude != null) {
        try {
          await User.findByIdAndUpdate(context.user.id, {
            latitude: result.latitude,
            longitude: result.longitude,
            location: [result.city, result.country].filter(Boolean).join(', '),
            locationUpdatedAt: new Date(),
            locationShared: false, // IP-detected, not user-confirmed
          });
        } catch (saveErr) {
          console.debug('[getMyIpGeolocation] Failed to save location:', saveErr);
        }
      }

      return {
        latitude: result.latitude ?? null,
        longitude: result.longitude ?? null,
        city: result.city ?? null,
        country: result.country ?? null,
      };
    },
    usersWithLocation: async (_: any, { role }: { role?: string }, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const filter: any = {
        latitude: { $ne: null, $exists: true },
        longitude: { $ne: null, $exists: true },
        isDeleted: { $ne: true },
      };
      if (role) filter.role = role;
      const users = await User.find(filter).select(
        'id username email role fullName avatar phone location latitude longitude locationUpdatedAt locationShared title'
      );
      return users.map((u: any) => ({
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        role: u.role,
        fullName: u.fullName,
        avatar: u.avatar,
        phone: u.phone,
        location: u.location,
        latitude: u.latitude,
        longitude: u.longitude,
        locationUpdatedAt: u.locationUpdatedAt?.toISOString(),
        locationShared: u.locationShared,
        title: u.title,
      }));
    },
  },
  Mutation: {
    updateUserLocation: async (_: any, { latitude, longitude }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const user = await User.findByIdAndUpdate(
        context.user.id,
        {
          latitude,
          longitude,
          locationUpdatedAt: new Date(),
          locationShared: true,
        },
        { new: true }
      );
      return user;
    },
    adminUpdateUserLocation: async (_: any, { userId, latitude, longitude }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const user = await User.findByIdAndUpdate(
        userId,
        {
          latitude,
          longitude,
          locationUpdatedAt: new Date(),
          locationShared: true,
        },
        { new: true }
      );
      return user;
    },
  },
};
