import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Si se especifica una propiedad, retornar solo esa propiedad
    if (data && user) {
      return user[data];
    }
    
    // Si no, retornar el usuario completo
    return user;
  },
);
