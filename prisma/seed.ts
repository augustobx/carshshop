import { PrismaClient, RolUsuario } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@carshop.com' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@carshop.com',
      password: 'admin', 
      rol: RolUsuario.Admin,
    },
  })

  const configDolar = await prisma.configuracion.upsert({
    where: { clave: 'dolar_blue' },
    update: {},
    create: {
      clave: 'dolar_blue',
      valor: '1000',
    },
  })

  const configTna = await prisma.configuracion.upsert({
    where: { clave: 'tna' },
    update: {},
    create: {
      clave: 'tna',
      valor: '0.05', 
    },
  })

  console.log({ admin, configDolar, configTna })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
