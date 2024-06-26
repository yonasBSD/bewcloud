import { Handlers } from 'fresh/server.ts';

import { DirectoryFile, FreshContextState } from '/lib/types.ts';
import { createFile, getFiles } from '/lib/data/files.ts';

interface Data {}

export interface ResponseBody {
  success: boolean;
  newFiles: DirectoryFile[];
}

export const handler: Handlers<Data, FreshContextState> = {
  async POST(request, context) {
    if (!context.state.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const requestBody = await request.clone().formData();

    const parentPath = requestBody.get('parent_path') as string;
    const name = requestBody.get('name') as string;
    const contents = requestBody.get('contents') as File | string;

    if (
      !parentPath || !name.trim() || !contents || !parentPath.startsWith('/') ||
      parentPath.includes('../')
    ) {
      return new Response('Bad Request', { status: 400 });
    }

    const fileContents = typeof contents === 'string' ? contents : await contents.arrayBuffer();

    const createdFile = await createFile(context.state.user.id, parentPath, name.trim(), fileContents);

    const newFiles = await getFiles(context.state.user.id, parentPath);

    const responseBody: ResponseBody = { success: createdFile, newFiles };

    return new Response(JSON.stringify(responseBody));
  },
};
