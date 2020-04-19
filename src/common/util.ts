export class Util {

    public static async(callback: (res, rej) => void): Promise<any> {
        return new Promise((resolve, reject) => callback(resolve, reject))
    }
}