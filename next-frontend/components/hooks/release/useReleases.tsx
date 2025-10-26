import type {
  CreateReleaseRequest,
  UpdateReleaseRequest,
} from "@/api/definitions/requests/release";
import * as ReleaseApi from "@/api/releaseApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useLatestUnseenRelease = () => {
  return useQuery({
    queryFn: ReleaseApi.getLatestUnseenRelease,
    queryKey: ["releases", "latest-unseen"],
    staleTime: Infinity,
  });
};

export const useAllReleases = () => {
  return useQuery({
    queryFn: ReleaseApi.listAllReleases,
    queryKey: ["releases", "admin", "all"],
  });
};

export const useRelease = (releaseId: string) => {
  return useQuery({
    enabled: !!releaseId,
    queryFn: async () => await ReleaseApi.getRelease(releaseId),
    queryKey: ["releases", "admin", releaseId],
  });
};

export const useCreateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateReleaseRequest) =>
      ReleaseApi.createRelease(request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["releases", "admin"] });
      await queryClient.invalidateQueries({ queryKey: ["releases", "public"] });
    },
  });
};

export const useUpdateRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      releaseId,
      request,
    }: {
      releaseId: string;
      request: UpdateReleaseRequest;
    }) => ReleaseApi.updateRelease(releaseId, request),
    onSuccess: async (_, { releaseId }) => {
      await queryClient.invalidateQueries({
        queryKey: ["releases", "admin", releaseId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["releases", "admin", "all"],
      });
      await queryClient.invalidateQueries({ queryKey: ["releases", "public"] });
    },
  });
};

export const useDeleteRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (releaseId: string) => ReleaseApi.deleteRelease(releaseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["releases", "admin"] });
      await queryClient.invalidateQueries({ queryKey: ["releases", "public"] });
    },
  });
};

export const usePublishRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (releaseId: string) => ReleaseApi.publishRelease(releaseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["releases"] });
    },
  });
};

export const useUnpublishRelease = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (releaseId: string) => ReleaseApi.unpublishRelease(releaseId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["releases"] });
    },
  });
};
