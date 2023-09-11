import pandas as pd
data = pd.read_csv('data/reading.txt',sep='\s+',header=None)
data = pd.DataFrame(data)

import matplotlib.pyplot as plt
x = data[0]
y = data[1]
plt.plot(x, y,'r--')
#plt.bar(x,y);
plt.xlabel("días");
plt.ylabel("páginas");

plt.savefig('figures/reading.png')
#plt.show();
