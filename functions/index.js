const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { getStorage } = require('firebase-admin/storage')

initializeApp()

// Roda todo dia às 03:00 BRT para deletar fotos com mais de 7 dias
exports.cleanupOldPhotos = onSchedule('every day 03:00', async () => {
  const db = getFirestore()
  const storage = getStorage()
  const bucket = storage.bucket()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const desafiosSnap = await db.collection('desafios').get()

  for (const desafioDoc of desafiosSnap.docs) {
    const checkinsSnap = await db
      .collection('desafios')
      .doc(desafioDoc.id)
      .collection('checkins')
      .where('criado_em', '<', sevenDaysAgo)
      .where('foto_removida', '==', false)
      .get()

    for (const checkinDoc of checkinsSnap.docs) {
      const data = checkinDoc.data()
      if (!data.foto_url) continue

      try {
        const filePath = `checkins/${desafioDoc.id}/${checkinDoc.id}.jpg`
        await bucket.file(filePath).delete()
        await checkinDoc.ref.update({ foto_url: null, foto_removida: true })
      } catch (e) {
        // Arquivo já deletado ou não existe — marca mesmo assim
        await checkinDoc.ref.update({ foto_removida: true })
      }
    }
  }

  console.log('Limpeza de fotos concluída.')
})
